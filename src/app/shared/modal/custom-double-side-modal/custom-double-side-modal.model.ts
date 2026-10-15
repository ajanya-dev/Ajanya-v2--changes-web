export interface DoubleSideModalConfig<D = unknown> {
  width?: string;
  maxHeight?: string;
  data?: D;
  disableClose?: boolean;
  panelClass?: string;
}

export interface SidePanelConfig<D = unknown> {
  width?: string;
  data?: D;
  panelClass?: string;
  /** When true the panel is pushed to the bottom of the right-panel column */
  stickyBottom?: boolean;
}

export interface SidePanelEntry {
  id: string;
  component: import('@angular/core').Type<unknown>;
  config: SidePanelConfig;
}
