#!/usr/bin/env python3
"""
Script to refactor oversized route files into subdirectories
Splits files into schemas.py, handlers.py, and route.py
"""

import os
import re
import shutil
from pathlib import Path
from typing import List, Dict, Tuple


def extract_imports(content: str) -> List[str]:
    """Extract import statements from file content"""
    import_pattern = r'^(from .+? import .+?|import .+?)$'
    imports = re.findall(import_pattern, content, re.MULTILINE)

    # Filter out local imports and router-specific imports
    filtered_imports = []
    for imp in imports:
        if 'APIRouter' not in imp and '__future__' not in imp:
            filtered_imports.append(imp)

    return filtered_imports


def extract_schemas(content: str) -> List[str]:
    """Extract Pydantic model classes"""
    # Match class definitions that inherit from BaseModel
    pattern = r'class \w+\(BaseModel\):.*?(?=\nclass |\n@router\.|\n\ndef |\Z)'
    matches = re.findall(pattern, content, re.DOTALL)
    return matches


def extract_routes(content: str) -> List[Tuple[str, str]]:
    """Extract route functions with their decorators"""
    # Match @router decorator followed by async def
    pattern = r'(@router\.\w+\([^)]*\).*?)\nasync def (\w+)\('
    decorator_matches = re.finditer(pattern, content, re.DOTALL)

    routes = []
    for match in decorator_matches:
        decorator = match.group(1)
        func_name = match.group(2)

        # Find the full function definition
        func_pattern = rf'@router\..*?\nasync def {func_name}\(.*?\n\):.*?(?=\n@router\.|\Z)'
        func_match = re.search(func_pattern, content, re.DOTALL)

        if func_match:
            routes.append((func_name, func_match.group(0)))

    return routes


def create_schemas_file(imports: List[str], schemas: List[str]) -> str:
    """Create schemas.py content"""
    content = '"""\nPydantic schemas for route validation\n"""\n\n'

    # Add necessary imports for schemas
    schema_imports = [
        'from pydantic import BaseModel, EmailStr',
        'from typing import Optional, List, Dict, Any',
        'from datetime import datetime'
    ]

    content += '\n'.join(schema_imports) + '\n\n\n'
    content += '\n\n\n'.join(schemas)

    return content


def create_handlers_file(imports: List[str]) -> str:
    """Create handlers.py skeleton"""
    content = '"""\nBusiness logic handlers for routes\n"""\n\n'

    # Add common handler imports
    handler_imports = [
        'from fastapi import HTTPException, status, Request',
        'from sqlalchemy.orm import Session',
        'from typing import Optional, List, Dict, Any, Tuple',
        'from datetime import datetime',
        'import logging',
        '',
        'logger = logging.getLogger(__name__)'
    ]

    content += '\n'.join(handler_imports) + '\n\n'
    content += '# TODO: Extract business logic from route handlers into functions here\n'

    return content


def create_route_file(route_name: str, imports: List[str], routes: List[Tuple[str, str]]) -> str:
    """Create main route file"""
    content = f'"""\n{route_name.capitalize()} routes\n"""\n\n'

    # Add router imports
    router_imports = [
        'from fastapi import APIRouter, Depends, HTTPException, status',
        'from sqlalchemy.orm import Session',
        '',
        'from backend.models.database import get_database',
        'from backend.auth.dependencies import get_current_user',
        ''
    ]

    content += '\n'.join(router_imports)
    content += '\nrouter = APIRouter()\n\n\n'

    # Add routes
    for func_name, route_code in routes:
        content += route_code + '\n\n\n'

    return content


def create_init_file() -> str:
    """Create __init__.py file"""
    return '''"""
Route package exports
"""

from .{module_name} import router

__all__ = ["router"]
'''


def refactor_file(file_path: str, output_dir: str, module_name: str):
    """Refactor a single route file"""
    print(f"Refactoring {file_path}...")

    with open(file_path, 'r') as f:
        content = f.read()

    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Extract components
    imports = extract_imports(content)
    schemas = extract_schemas(content)
    routes = extract_routes(content)

    print(f"  - Found {len(imports)} imports")
    print(f"  - Found {len(schemas)} schemas")
    print(f"  - Found {len(routes)} routes")

    # Create schemas file if schemas exist
    if schemas:
        schemas_content = create_schemas_file(imports, schemas)
        with open(output_path / 'schemas.py', 'w') as f:
            f.write(schemas_content)
        print(f"  - Created schemas.py ({len(schemas_content.splitlines())} lines)")

    # Create handlers file skeleton
    handlers_content = create_handlers_file(imports)
    with open(output_path / 'handlers.py', 'w') as f:
        f.write(handlers_content)
    print(f"  - Created handlers.py skeleton")

    # Copy original file to new location for manual refactoring
    shutil.copy(file_path, output_path / f'{module_name}.py')
    print(f"  - Copied original to {module_name}.py for manual refactoring")

    # Create __init__.py
    init_content = create_init_file().format(module_name=module_name)
    with open(output_path / '__init__.py', 'w') as f:
        f.write(init_content)
    print(f"  - Created __init__.py")

    print(f"✓ Completed refactoring {file_path}\n")


def main():
    """Main refactoring function"""
    base_path = '/Users/zhuchen/Downloads/Test1-frazo/backend/api/routes'

    # Files to refactor with their target directories
    files_to_refactor = [
        ('jobs.py', 'jobs', 'jobs'),
        ('direct_process.py', 'jobs', 'direct_process'),
        ('files.py', 'files', 'files'),
        ('admin.py', 'admin', 'admin'),
        ('users.py', 'users', 'users'),
        ('ghostcut.py', 'video_editors', 'ghostcut'),
        ('sync_api.py', 'video_editors', 'sync_api'),
        ('pro_sync_api.py', 'video_editors', 'pro_sync_api'),
        ('upload_and_process.py', 'upload', 'upload_and_process'),
        ('chunked_upload.py', 'upload', 'chunked_upload'),
    ]

    for filename, target_dir, module_name in files_to_refactor:
        file_path = os.path.join(base_path, filename)
        if os.path.exists(file_path):
            output_dir = os.path.join(base_path, target_dir)
            try:
                refactor_file(file_path, output_dir, module_name)
            except Exception as e:
                print(f"✗ Error refactoring {filename}: {e}\n")
        else:
            print(f"✗ File not found: {file_path}\n")

    print("=" * 60)
    print("Refactoring complete!")
    print("Next steps:")
    print("1. Manually split large route functions in each subdirectory")
    print("2. Extract business logic to handlers.py")
    print("3. Update imports in backend/api/main.py")
    print("4. Test each route thoroughly")


if __name__ == '__main__':
    main()
