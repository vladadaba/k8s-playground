export class OrderDto {
  productId: string;
  quantity: number;
  constructor(productId: string, quantity: number, cost: number) {
    this.productId = productId;
    this.quantity = quantity;
  }
}
export class ApproveOrderDto {
  orderId: string;
  approverId: string;
  isApproved: boolean;
  constructor(orderId: string, approverId: string, isApproved: boolean) {
    this.orderId = orderId;
    this.approverId = approverId;
    this.isApproved = isApproved;
  }
}
