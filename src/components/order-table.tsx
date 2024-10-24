"use client";

import { $Enums, type Order, type OrderItem } from "@prisma/client";
import { useCallback, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  type PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { trpc } from "@/utils/trpc/client";
import Loader from "./loader";
import { cn } from "@/lib/utils";
import { debounce } from "ts-debounce";

interface ExtendedOrder extends Order {
  items: Array<OrderItem>;
}

const columnHelper = createColumnHelper<ExtendedOrder>();

const tableColumns = [
  columnHelper.accessor("createdAt", {
    cell: (info) => info.getValue().toLocaleString(),
    header: () => "Date",
  }),
  columnHelper.accessor("customer", {
    cell: (info) => info.getValue(),
    header: () => "Customer",
  }),
  columnHelper.accessor("address", {
    cell: (info) => info.getValue(),
    header: () => "Address",
  }),
  columnHelper.accessor("status", {
    cell: (info) => (
      <span
        className={cn(
          "font-semibold capitalize",
          info.getValue() === "FULFILLED"
            ? "text-green-600"
            : info.getValue() === "SHIPPED"
            ? "text-purple-600"
            : info.getValue() === "PENDING"
            ? "text-blue-600"
            : "text-red-600"
        )}
      >
        {info.getValue().toLowerCase()}
      </span>
    ),
    header: () => "Status",
  }),
  columnHelper.accessor("items", {
    cell: (info) => (
      <ul className="list-disc">
        {info.getValue().map((item) => (
          <li key={item.id}>{item.name} </li>
        ))}{" "}
      </ul>
    ),
  }),
];

const OrderTable = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [status, setStatus] = useState<$Enums.FulfilmentStatus | undefined>(
    undefined
  );

  const getOrders = trpc.getOrders.useQuery(
    {
      limit: pagination.pageSize,
      status,
      page: pagination.pageIndex + 1,
    },
    { keepPreviousData: true, cacheTime: 36000, refetchOnWindowFocus: false } //Cached for 10 minutes
  );

  const orders = getOrders.data?.orders?.map((order) => ({
    ...order,
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
  }));

  const columns = useMemo(() => tableColumns, []);
  const defaultData = useMemo(() => [], []);

  const table = useReactTable({
    columns,
    data: orders ?? defaultData,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    rowCount: getOrders.data?.totalOrders,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    manualPagination: true,
  });

  const scrollTop = useCallback(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, []);

  const debouncedSetPage = useMemo(
    () =>
      debounce((page: number) => {
        table.setPageIndex(page);
        scrollTop();
      }, 1000),
    [table, scrollTop]
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {getOrders.isFetching && !getOrders.isLoading && (
        <div className="fixed left-4 top-4">
          <Loader width="40" height="40" />
        </div>
      )}

      {getOrders.isLoading ? (
        <div className="h-full grid justify-items-center mt-12">
          <Loader height="80" width="80" />
          <span>Loading...</span>
        </div>
      ) : getOrders.isError ? (
        <div className="h-full flex flex-col items-center justify-center text-center gap-2 mt-12">
          <p>Something went wrong, please try again</p>
          <p className="max-w-xl">{getOrders.error.message}</p>
          <Button
            onClick={() => getOrders.refetch()}
            className="ml-2"
            disabled={getOrders.isFetching}
          >
            Try again
          </Button>
        </div>
      ) : (
        <div>
          <div className="flex justify-end mb-4">
            <Select
              value={status ?? "All"}
              onValueChange={(value) =>
                setStatus(
                  value === "All"
                    ? undefined
                    : (value as $Enums.FulfilmentStatus)
                )
              }
              disabled={getOrders.isFetching}
            >
              <SelectTrigger className="w-40 capitalize">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {Object.values($Enums.FulfilmentStatus).map((status, index) => (
                  <SelectItem
                    key={index.toString()}
                    value={status}
                    className="capitalize"
                  >
                    {status.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <table className="w-full border">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="text-start p-4 border-b">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="items-start">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-6 px-4 border-b">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-center gap-6 mt-10">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  scrollTop();
                  table.previousPage();
                }}
                disabled={!table.getCanPreviousPage() || getOrders.isFetching}
              >
                {"<"}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  scrollTop();
                  table.nextPage();
                }}
                disabled={!table.getCanNextPage() || getOrders.isFetching}
              >
                {">"}
              </Button>

              <span>
                <span>Page</span>{" "}
                <strong>
                  {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount().toLocaleString()}{" "}
                </strong>
              </span>
            </div>

            <div className="flex gap-2 items-center">
              <span>Go to page</span>

              <Input
                type="number"
                min="1"
                max={table.getPageCount()}
                defaultValue={table.getState().pagination.pageIndex + 1}
                onChange={(e) => {
                  const page = e.target.value
                    ? Math.min(
                        Number(e.target.value) - 1,
                        table.getPageCount() - 1
                      )
                    : 0;
                  debouncedSetPage(page);
                }}
                disabled={getOrders.isFetching}
                className="w-16"
              />
            </div>

            <div className="flex gap-2 items-center">
              <span>Show</span>

              <Select
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                  scrollTop();
                }}
                disabled={getOrders.isFetching}
              >
                <SelectTrigger>
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={pageSize.toString()}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTable;
