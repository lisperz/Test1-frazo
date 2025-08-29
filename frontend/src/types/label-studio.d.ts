declare module 'label-studio' {
  export interface LSFConfig {
    config: string;  // Changed from xml to config
    interfaces: string[];
    user?: {
      pk: number;
      firstName?: string;
      lastName?: string;
    };
    task?: {
      annotations?: any[];
      predictions?: any[];
      id: number;
      data: any;
    };
    onLabelStudioLoad?: (ls: any) => void;
    onSubmitAnnotation?: (ls: any, annotation: any) => void;
    onUpdateAnnotation?: (ls: any, annotation: any) => void;
    onDeleteAnnotation?: (ls: any, annotation: any) => void;
    onSkipTask?: (ls: any) => void;
    onGroundTruth?: (ls: any, annotation: any) => void;
    onEntityCreate?: (region: any) => void;
    onEntityDelete?: (region: any) => void;
  }

  class LabelStudio {
    constructor(element: HTMLElement, config: LSFConfig);
    destroy(): void;
    submitAnnotation(): void;
    updateAnnotation(annotation: any): void;
    deleteAnnotation(annotation: any): void;
    setLSFTask(task: any): void;
    setFlags(flags: any): void;
    store: {
      annotationStore: {
        selectedHistory: any;
        selectHistory(id: string): void;
        addAnnotation(annotation: any): void;
        annotations: any[];
      };
      completionStore: {
        completions: any[];
      };
      taskStore: {
        task: any;
      };
    };
  }

  export default LabelStudio;
}

declare module 'label-studio/build/static/css/main.css' {
  const content: any;
  export default content;
}