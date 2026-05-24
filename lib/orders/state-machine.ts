import { OrderStatus, TransitionActor, ChildOrder } from '../../types/orders.types'
import { transitionOrderStatus, getChildOrderById } from '../db/orders'
import { dispatchNotification } from './order-notifications'

// Full map of allowed transitions
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered: ['completed', 'refund_requested'],
  completed: [], // terminal state
  cancelled: [], // terminal state
  refund_requested: ['refunded', 'processing'],
  refunded: [], // terminal state
};

/**
 * Checks if a status transition is allowed for a given actor role.
 */
export function canTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  actorRole: TransitionActor
): { allowed: boolean; reason?: string } {
  // 1. Check if the transition is defined in the state graph
  const allowedNext = VALID_TRANSITIONS[currentStatus];
  if (!allowedNext || !allowedNext.includes(newStatus)) {
    return {
      allowed: false,
      reason: `Invalid transition path in state machine graph from "${currentStatus}" to "${newStatus}".`,
    };
  }

  // 2. Admin can bypass role checks
  if (actorRole === 'admin') {
    return { allowed: true };
  }

  // 3. Seller role permission boundaries
  if (actorRole === 'seller') {
    const allowedSellerTransitions = [
      { from: 'pending', to: 'confirmed' },
      { from: 'confirmed', to: 'processing' },
      { from: 'processing', to: 'shipped' },
      { from: 'pending', to: 'cancelled' },
      { from: 'confirmed', to: 'cancelled' },
    ];

    const hasPermission = allowedSellerTransitions.some(
      (t) => t.from === currentStatus && t.to === newStatus
    );

    if (!hasPermission) {
      return {
        allowed: false,
        reason: `Artisan/Seller does not have permission to transition from "${currentStatus}" to "${newStatus}".`,
      };
    }
  }

  // 4. Buyer role permission boundaries
  if (actorRole === 'buyer') {
    const allowedBuyerTransitions = [
      { from: 'delivered', to: 'completed' },
      { from: 'delivered', to: 'refund_requested' },
    ];

    const hasPermission = allowedBuyerTransitions.some(
      (t) => t.from === currentStatus && t.to === newStatus
    );

    if (!hasPermission) {
      return {
        allowed: false,
        reason: `Tourist/Buyer does not have permission to transition from "${currentStatus}" to "${newStatus}".`,
      };
    }
  }

  // 5. System role permission boundaries (sweep timers and delivery automations)
  if (actorRole === 'system') {
    const allowedSystemTransitions = [
      { from: 'shipped', to: 'out_for_delivery' },
      { from: 'delivered', to: 'completed' },
      { from: 'pending', to: 'cancelled' },
    ];

    const hasPermission = allowedSystemTransitions.some(
      (t) => t.from === currentStatus && t.to === newStatus
    );

    if (!hasPermission) {
      return {
        allowed: false,
        reason: `System background worker does not have permission to transition from "${currentStatus}" to "${newStatus}".`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Transitions an order status atomically, registers log history, and dispatches notification events.
 */
export async function transitionOrder(
  childOrderId: string,
  newStatus: OrderStatus,
  actorId: string | null,
  actorRole: TransitionActor,
  note?: string
): Promise<ChildOrder> {
  // 1. Fetch current order
  const orderDetails = await getChildOrderById(childOrderId, 'admin');
  const childOrder = orderDetails.childOrder as ChildOrder;
  const parentOrder = orderDetails.parentOrder;

  // 2. Validate transition
  const check = canTransition(childOrder.status, newStatus, actorRole);
  if (!check.allowed) {
    throw new Error(check.reason || 'Transition blocked by state machine.');
  }

  // 3. Database status transition execution
  const updatedOrder = await transitionOrderStatus(childOrderId, newStatus, actorId, note);

  // 4. Dispatch notification events asynchronously
  try {
    await dispatchNotification(newStatus, {
      childOrderId: updatedOrder.id,
      buyerId: parentOrder.buyer_id,
      storeId: updatedOrder.store_id,
      trackingNumber: updatedOrder.tracking_number,
      carrier: updatedOrder.carrier,
    });
  } catch (err) {
    console.error('Failed to dispatch transition notifications:', err);
    // Do not throw to ensure transaction completeness
  }

  return updatedOrder;
}
