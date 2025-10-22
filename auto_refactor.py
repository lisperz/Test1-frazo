#!/usr/bin/env python3
"""
Automated refactoring script for route files
Splits large route files into schemas, utils, and routes (<300 lines each)
"""

import os
import re
from pathlib import Path
from typing import List, Tuple


def split_file_into_sections(filepath: str) -> dict:
    """Split a Python file into logical sections"""
    with open(filepath, 'r') as f:
        lines = f.readlines()

    sections = {
        'docstring': [],
        'imports': [],
        'schemas': [],
        'router_def': [],
        'helper_functions': [],
        'routes': []
    }

    current_section = 'docstring'
    in_class = False
    in_function = False
    in_route = False
    indent_stack = []
    buffer = []

    for i, line in enumerate(lines):
        stripped = line.lstrip()

        # Detect imports
        if stripped.startswith(('import ', 'from ')) and not in_class and not in_function:
            if current_section != 'imports':
                if buffer:
                    sections[current_section].extend(buffer)
                    buffer = []
                current_section = 'imports'
            buffer.append(line)

        # Detect router definition
        elif 'router = APIRouter()' in line:
            if buffer:
                sections[current_section].extend(buffer)
                buffer = []
            sections['router_def'].append(line)
            current_section = 'helper_functions'

        # Detect class definitions (schemas)
        elif stripped.startswith('class ') and '(BaseModel)' in line:
            if buffer:
                sections[current_section].extend(buffer)
                buffer = []
            current_section = 'schemas'
            in_class = True
            buffer.append(line)

        # Detect route decorators
        elif stripped.startswith('@router.'):
            if buffer:
                sections[current_section].extend(buffer)
                buffer = []
            current_section = 'routes'
            in_route = True
            buffer.append(line)

        # Detect regular function definitions
        elif stripped.startswith('def ') or stripped.startswith('async def '):
            if not in_route:
                if buffer and current_section != 'helper_functions':
                    sections[current_section].extend(buffer)
                    buffer = []
                current_section = 'helper_functions'
            in_function = True
            buffer.append(line)

        # Continue accumulating current section
        else:
            buffer.append(line)

            # Track class/function end
            if in_class or in_function or in_route:
                # Simple heuristic: if we hit a non-indented line after indented content
                if stripped and not line[0].isspace() and len(buffer) > 1:
                    prev_line = buffer[-2].lstrip()
                    if prev_line and not prev_line.startswith('#'):
                        in_class = False
                        in_function = False
                        if in_route and not stripped.startswith('@'):
                            in_route = False

    # Add remaining buffer
    if buffer:
        sections[current_section].extend(buffer)

    return sections


def create_schemas_file(sections: dict, module_name: str) -> str:
    """Create schemas.py from extracted schemas"""
    content = [
        '"""',
        f'Pydantic schemas for {module_name} routes',
        '"""',
        '',
    ]

    # Add schema-specific imports
    schema_imports = [
        'from pydantic import BaseModel, EmailStr',
        'from typing import Optional, List, Dict, Any',
        'from datetime import datetime',
        '',
        ''
    ]
    content.extend(schema_imports)

    # Add schemas
    if sections['schemas']:
        content.extend([line.rstrip() for line in sections['schemas']])

    return '\n'.join(content)


def create_utils_file(sections: dict, module_name: str) -> str:
    """Create utils.py from helper functions"""
    content = [
        '"""',
        f'Utility functions for {module_name} routes',
        '"""',
        '',
    ]

    # Add necessary imports
    util_imports = [
        'from typing import Optional, List, Dict, Any',
        'from datetime import datetime',
        'import logging',
        '',
        'logger = logging.getLogger(__name__)',
        '',
        ''
    ]
    content.extend(util_imports)

    # Add helper functions
    if sections['helper_functions']:
        content.extend([line.rstrip() for line in sections['helper_functions']])

    return '\n'.join(content)


def create_routes_file(sections: dict, module_name: str) -> str:
    """Create routes file with imports and route definitions"""
    content = [
        '"""',
        f'{module_name.capitalize()} routes',
        '"""',
        '',
    ]

    # Add imports
    if sections['imports']:
        content.extend([line.rstrip() for line in sections['imports']])
        content.append('')

    # Add router definition
    content.append('router = APIRouter()')
    content.append('')
    content.append('')

    # Add routes
    if sections['routes']:
        content.extend([line.rstrip() for line in sections['routes']])

    return '\n'.join(content)


def split_routes_further(routes_content: str, max_lines: int = 250) -> List[Tuple[str, str]]:
    """Split routes into multiple files if too long"""
    lines = routes_content.split('\n')

    if len(lines) <= max_lines:
        return [('routes', routes_content)]

    # Split by route functions
    route_files = []
    current_file = []
    current_name = 'routes_part1'
    part_num = 1

    in_route = False
    route_buffer = []

    for line in lines:
        if line.strip().startswith('@router.'):
            if route_buffer and len(current_file) + len(route_buffer) > max_lines:
                # Save current file
                route_files.append((current_name, '\n'.join(current_file)))
                current_file = []
                part_num += 1
                current_name = f'routes_part{part_num}'

            if route_buffer:
                current_file.extend(route_buffer)
                route_buffer = []

            in_route = True

        if in_route:
            route_buffer.append(line)
        else:
            current_file.append(line)

    # Add remaining content
    if route_buffer:
        current_file.extend(route_buffer)

    if current_file:
        route_files.append((current_name, '\n'.join(current_file)))

    return route_files


def refactor_single_file(source_path: str, target_dir: str, module_name: str):
    """Refactor a single route file"""
    print(f"\nRefactoring: {source_path}")
    print(f"Target dir: {target_dir}")

    # Parse file
    sections = split_file_into_sections(source_path)

    # Create target directory
    os.makedirs(target_dir, exist_ok=True)

    # Create schemas.py if we have schemas
    if sections['schemas']:
        schemas_content = create_schemas_file(sections, module_name)
        schemas_path = os.path.join(target_dir, 'schemas.py')
        with open(schemas_path, 'w') as f:
            f.write(schemas_content)
        print(f"  ✓ Created schemas.py ({len(schemas_content.splitlines())} lines)")

    # Create utils.py if we have helper functions
    if sections['helper_functions']:
        utils_content = create_utils_file(sections, module_name)
        utils_path = os.path.join(target_dir, 'utils.py')
        with open(utils_path, 'w') as f:
            f.write(utils_content)
        print(f"  ✓ Created utils.py ({len(utils_content.splitlines())} lines)")

    # Create routes file(s)
    routes_content = create_routes_file(sections, module_name)
    route_files = split_routes_further(routes_content, max_lines=280)

    for filename, content in route_files:
        route_path = os.path.join(target_dir, f'{filename}.py')
        with open(route_path, 'w') as f:
            f.write(content)
        print(f"  ✓ Created {filename}.py ({len(content.splitlines())} lines)")

    # Update __init__.py
    init_path = os.path.join(target_dir, '__init__.py')
    init_content = f'''"""
{module_name.capitalize()} routes package
"""

from .routes import router

__all__ = ["router"]
'''
    with open(init_path, 'w') as f:
        f.write(init_content)
    print(f"  ✓ Updated __init__.py")


def main():
    """Main refactoring execution"""
    base_dir = '/Users/zhuchen/Downloads/Test1-frazo/backend/api/routes'

    # Define refactoring targets
    targets = [
        (f'{base_dir}/jobs/jobs_original.py', f'{base_dir}/jobs', 'jobs'),
        (f'{base_dir}/jobs/direct_process_original.py', f'{base_dir}/jobs', 'direct_process'),
        (f'{base_dir}/files/files_original.py', f'{base_dir}/files', 'files'),
        (f'{base_dir}/admin/admin_original.py', f'{base_dir}/admin', 'admin'),
        (f'{base_dir}/users/users_original.py', f'{base_dir}/users', 'users'),
        (f'{base_dir}/video_editors/ghostcut_original.py', f'{base_dir}/video_editors', 'ghostcut'),
        (f'{base_dir}/video_editors/sync_api_original.py', f'{base_dir}/video_editors', 'sync_api'),
        (f'{base_dir}/video_editors/pro_sync_api_original.py', f'{base_dir}/video_editors', 'pro_sync_api'),
    ]

    print("=" * 70)
    print("AUTOMATED ROUTE REFACTORING")
    print("=" * 70)

    for source, target, module in targets:
        if os.path.exists(source):
            try:
                refactor_single_file(source, target, module)
            except Exception as e:
                print(f"  ✗ Error: {e}")
        else:
            print(f"\n✗ File not found: {source}")

    print("\n" + "=" * 70)
    print("REFACTORING COMPLETE")
    print("=" * 70)


if __name__ == '__main__':
    main()
