export {};

declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initCodeClient: (config: {
            client_id: string;
            scope: string;
            ux_mode: string;
            callback: (response: { code: string }) => void;
          }) => { requestCode: () => void };
        };
      };
    };
  }
}


declare global {
    namespace google {
      namespace accounts {
        namespace oauth2 {
          interface CodeResponse {
            code: string;
          }
  
          interface TokenClientConfig {
            client_id: string;
            scope: string;
            ux_mode: string;
            callback: (response: CodeResponse) => void;
          }
  
          interface TokenClient {
            requestCode: () => void;
          }
  
          function initCodeClient(config: TokenClientConfig): TokenClient;
        }
      }
    }
  }