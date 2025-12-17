
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const DriverListPagination = ({ currentPage, totalPages, onPageChange }: Props) => {
  const pages = [] as number[];
  for (let i = 1; i <= totalPages; i++) pages.push(i);

  const goto = (p: number) => {
    const next = Math.max(1, Math.min(totalPages, p));
    if (next !== currentPage) onPageChange(next);
  };

  return (
    <div className="mt-4">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); goto(currentPage - 1); }} />
          </PaginationItem>

          {pages.map((p) => (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                isActive={p === currentPage}
                onClick={(e) => {
                  e.preventDefault();
                  goto(p);
                }}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext href="#" onClick={(e) => { e.preventDefault(); goto(currentPage + 1); }} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default DriverListPagination;
