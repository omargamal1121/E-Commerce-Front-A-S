import React from 'react';

const Pagination = ({ currentPage, totalPages, paginate }) => {
  if (!Number.isFinite(totalPages) || totalPages < 1) return null;
  
  return (
    <div className="flex justify-center items-center mt-6 mb-4">
      <nav className="flex items-center gap-2">
        <button
          onClick={() => paginate(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-md mr-2 bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex space-x-1">
          {[...Array(totalPages).keys()].map((number) => (
            <button
              key={number + 1}
              onClick={() => paginate(number + 1)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                currentPage === number + 1
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {number + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-md ml-2 bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>

        <span className="ml-3 text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
      </nav>
    </div>
  );
};

export default Pagination;