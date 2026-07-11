import { useState, useEffect, useCallback } from "react";
import {
  purchaseOrderService,
  PurchaseOrder,
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
        search,
      });
      setPurchaseOrders(response.data);
      setTotalPages(response.totalPages);
      setTotalItems(response.total);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch purchase orders");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchPOs();
  }, [fetchPOs]);

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
    reason?: string,
  ) => {
    try {
      await purchaseOrderService.approvePurchaseOrder(id, {
        status,
        rejectionReason: reason,
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

  const issuePO = async (id: string) => {
    try {
      await purchaseOrderService.issueMaterialToRequester(id);
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
    setLimit,
    search,
    setSearch,
    totalPages,
    totalItems,
    refetch: fetchPOs,
    cancelPO,
    approvePO,
    orderPO,
    issuePO,
  };
}
