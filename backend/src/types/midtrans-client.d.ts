declare module 'midtrans-client' {
  interface SnapOptions {
    isProduction: boolean;
    serverKey: string;
    clientKey?: string;
  }

  interface TransactionResult {
    token: string;
    redirect_url: string;
  }

  class Snap {
    constructor(options: SnapOptions);
    createTransaction(parameter: any): Promise<TransactionResult>;
  }

  class CoreApi {
    constructor(options: SnapOptions);
    transaction: {
      status(orderId: string): Promise<any>;
    };
  }

  export { Snap, CoreApi };
  export default { Snap, CoreApi };
}
