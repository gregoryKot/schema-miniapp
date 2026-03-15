declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        colorScheme: 'light' | 'dark';
        themeParams: Record<string, string>;
        ready(): void;
        expand(): void;
        close(): void;
        MainButton: {
          text: string;
          isVisible: boolean;
          isActive: boolean;
          show(): void;
          hide(): void;
          enable(): void;
          disable(): void;
          onClick(fn: () => void): void;
          offClick(fn: () => void): void;
          showProgress(leaveActive: boolean): void;
          hideProgress(): void;
        };
      };
    };
  }
}

export {};
