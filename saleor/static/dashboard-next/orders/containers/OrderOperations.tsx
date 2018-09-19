import * as React from "react";

import {
  MutationProviderProps,
  MutationProviderRenderProps,
  PartialMutationProviderOutput
} from "../..";
import {
  OrderCaptureMutation,
  OrderCaptureMutationVariables,
  OrderCreateFulfillmentMutation,
  OrderCreateFulfillmentMutationVariables,
  OrderRefundMutation,
  OrderRefundMutationVariables
} from "../../gql-types";
import { maybe } from "../../misc";
import { OrderUpdate, OrderUpdateVariables } from "../types/OrderUpdate";
import OrderCreateFulfillmentProvider from "./OrderCreateFulfillment";
import OrderPaymentCaptureProvider from "./OrderPaymentCapture";
import OrderPaymentRefundProvider from "./OrderPaymentRefund";
import OrderUpdateProvider from "./OrderUpdate";

interface OrderOperationsProps extends MutationProviderProps {
  order: string;
  children: MutationProviderRenderProps<{
    orderCreateFulfillment: PartialMutationProviderOutput<
      OrderCreateFulfillmentMutation,
      OrderCreateFulfillmentMutationVariables
    >;
    orderPaymentCapture: PartialMutationProviderOutput<
      OrderCaptureMutation,
      OrderCaptureMutationVariables
    >;
    orderPaymentRefund: PartialMutationProviderOutput<
      OrderRefundMutation,
      OrderRefundMutationVariables
    >;
    orderUpdate: PartialMutationProviderOutput<
      OrderUpdate,
      OrderUpdateVariables
    >;
  }>;
  onFulfillmentCreate: (data: OrderCreateFulfillmentMutation) => void;
  onPaymentCapture: (data: OrderCaptureMutation) => void;
  onPaymentRefund: (data: OrderRefundMutation) => void;
  onUpdate: (data: OrderUpdate) => void;
}

const OrderOperations: React.StatelessComponent<OrderOperationsProps> = ({
  children,
  order,
  onError,
  onFulfillmentCreate,
  onPaymentCapture,
  onPaymentRefund,
  onUpdate
}) => (
  <OrderPaymentCaptureProvider
    id={order}
    onError={onError}
    onSuccess={onPaymentCapture}
  >
    {paymentCapture => (
      <OrderPaymentRefundProvider
        id={order}
        onError={onError}
        onSuccess={onPaymentRefund}
      >
        {paymentRefund => (
          <OrderCreateFulfillmentProvider
            id={order}
            onError={onError}
            onSuccess={onFulfillmentCreate}
          >
            {createFulfillment => (
              <OrderUpdateProvider onError={onError} onSuccess={onUpdate}>
                {update =>
                  children({
                    errors: [
                      ...maybe(
                        () => createFulfillment.data.fulfillmentCreate.errors,
                        [] as any
                      ),
                      ...maybe(
                        () => paymentCapture.data.orderCapture.errors,
                        [] as any
                      ),
                      ...maybe(
                        () => paymentRefund.data.orderRefund.errors,
                        [] as any
                      ),
                      ...maybe(() => update.data.orderUpdate.errors, [])
                    ],
                    orderCreateFulfillment: {
                      data: createFulfillment.data,
                      loading: createFulfillment.loading,
                      mutate: variables =>
                        createFulfillment.mutate({
                          variables: {
                            ...variables,
                            input: { ...variables.input, order }
                          }
                        })
                    },
                    orderPaymentCapture: {
                      data: paymentCapture.data,
                      loading: paymentCapture.loading,
                      mutate: variables => paymentCapture.mutate({ variables })
                    },
                    orderPaymentRefund: {
                      data: paymentRefund.data,
                      loading: paymentRefund.loading,
                      mutate: variables => paymentRefund.mutate({ variables })
                    },
                    orderUpdate: {
                      data: update.data,
                      loading: update.loading,
                      mutate: variables => update.mutate({ variables })
                    }
                  })
                }
              </OrderUpdateProvider>
            )}
          </OrderCreateFulfillmentProvider>
        )}
      </OrderPaymentRefundProvider>
    )}
  </OrderPaymentCaptureProvider>
);
export default OrderOperations;
