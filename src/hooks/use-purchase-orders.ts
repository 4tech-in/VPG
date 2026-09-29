import { useState, useEffect, useCallback } from "react";
import {
  purchaseOrderService,
  PurchaseOrder
} from "@/service/purchaseOrderService";
import { toast } from "sonner";

export function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchPOs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await purchaseOrderService.getPurchaseOrders({
        page,
        limit,
        search
      });
      const orders = [...(response.data || [])];
      setPurchaseOrders(orders);
      setTotalPages(response.totalPages);
      setTotalItems(response.total);

      // Load full order details (items, issued/used quantities, receipts) to ensure Material Used & Pending match exactly
      await Promise.all(
        orders.map(async (po, index) => {
          const id = po._id || po.id;
          if (!id) return;
          try {
            const details = await purchaseOrderService.getPurchaseOrderById(id);
            const items = details.items || po.items || [];
            const totalIssued = items.reduce(
              (sum: number, it: any) =>
                sum + Number(it.issuedToRequesterQuantity || 0),
              0
            );
            const totalReceived = items.reduce(
              (sum: number, it: any) => sum + Number(it.receivedQuantity || 0),
              0
            );
            const totalOrdered = items.reduce(
              (sum: number, it: any) =>
                sum + Number(it.orderQuantity ?? it.indentQuantity ?? 0),
              0
            );

            const used =
              details.materialUsed != null &&
              Number.isFinite(Number(details.materialUsed))
                ? Number(details.materialUsed)
                : totalIssued > 0
                  ? totalIssued
                  : details.status === "Issued" && totalReceived > 0
                    ? totalReceived
                    : totalIssued;

            const total =
              details.totalCount != null &&
              Number.isFinite(Number(details.totalCount))
                ? Number(details.totalCount)
                : details.totalQuantity != null &&
                    Number.isFinite(Number(details.totalQuantity))
                  ? Number(details.totalQuantity)
                  : totalOrdered;

            const pending =
              details.pending != null &&
              Number.isFinite(Number(details.pending))
                ? Number(details.pending)
                : Math.max(0, total - used);

            orders[index] = {
              ...po,
              ...details,
              items,
              materialUsed: used,
              totalCount: total,
              totalQuantity: total,
              pending: pending
            };
          } catch (e) {
            console.error("Failed to load details for PO", id, e);
          }
        })
      );
      setPurchaseOrders([...orders]);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch purchase orders");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchPOs();
  }, [fetchPOs]);

  const changeSearch = useCallback((value: string) => {
    setPage(1);
    setSearch(value);
  }, []);

  const changeLimit = useCallback((value: number) => {
    setPage(1);
    setLimit(value);
  }, []);

  const cancelPO = async (id: string) => {
    try {
      await purchaseOrderService.cancelPurchaseOrder(id);
      toast.success("Purchase order cancelled successfully");
      fetchPOs();
    } catch (err) {}
  };

  const approvePO = async (
    id: string,
    status: "Approved" | "Rejected",
    reason?: string
  ) => {
    try {
      await purchaseOrderService.approvePurchaseOrder(id, {
        status,
        rejectionReason: reason
      });
      toast.success(`Purchase order ${status.toLowerCase()} successfully`);
      fetchPOs();
    } catch (err) {}
  };

  const orderPO = async (id: string) => {
    try {
      await purchaseOrderService.markPurchaseOrderOrdered(id);
      toast.success("Purchase order marked as ordered");
      fetchPOs();
    } catch (err) {}
  };

  const issuePO = async (
    id: string,
    payload: { items: { itemId: string; supplyQuantity: number }[] }
  ) => {
    try {
      await purchaseOrderService.issueMaterialToRequester(id, payload);
      toast.success("Materials issued to requester");
      fetchPOs();
    } catch (err) {}
  };

  return {
    purchaseOrders,
    isLoading,
    page,
    setPage,
    limit,
    setLimit: changeLimit,
    search,
    setSearch: changeSearch,
    totalPages,
    totalItems,
    refetch: fetchPOs,
    cancelPO,
    approvePO,
    orderPO,
    issuePO
  };
}
