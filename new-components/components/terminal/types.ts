export interface HistoryLine {
  type: 'command' | 'output' | 'error';
  content: string | React.ReactNode;
  cwd?: string;
}
