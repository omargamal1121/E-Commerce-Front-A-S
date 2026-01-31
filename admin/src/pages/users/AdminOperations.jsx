import React, { useState, useEffect } from "react";
import API from "../../services/api";
import { toast } from "react-toastify";

const AdminOperations = ({ token }) => {
    const [operations, setOperations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        page: 1,
        pageSize: 10,
        userId: "",
        name: "",
        operation: "",
    });
    const [totalPages, setTotalPages] = useState(1);

    const fetchOperations = async () => {
        setLoading(true);
        try {
            const params = {
                page: filters.page,
                pagesize: filters.pageSize,
                userid: filters.userId,
                name: filters.name,
                opreation: filters.operation,
            };
            // Remove empty params
            Object.keys(params).forEach(
                (key) => (params[key] === "" || params[key] === null) && delete params[key]
            );

            const response = await API.adminOperations.getAll(params, token);
            if (response && response.data) {
                setOperations(response.data);
                // Assuming the API returns total count or pages to handle pagination correctly
                // If not, we might need to adjust. For now, let's assume we can just paginate blindly or if there's metadata.
                // The provided response example doesn't show total count, so we might need to rely on "next" button logic or similar if not provided.
                // For this implementation, I'll assume a simple next/prev based on data presence or a fixed number if available.
                // Since the response example is just { message, data, links }, I'll just show the data.
            } else {
                setOperations([]);
            }
        } catch (error) {
            console.error("Error fetching admin operations:", error);
            toast.error("Failed to fetch admin operations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOperations();
    }, [filters.page, filters.pageSize]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setFilters((prev) => ({ ...prev, page: 1 })); // Reset to page 1 on search
        fetchOperations();
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0) {
            setFilters((prev) => ({ ...prev, page: newPage }));
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-sm">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Admin Operations</h1>

            {/* Filters */}
            <form onSubmit={handleSearch} className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                    type="text"
                    name="userId"
                    placeholder="User ID"
                    value={filters.userId}
                    onChange={handleFilterChange}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={filters.name}
                    onChange={handleFilterChange}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                    name="operation"
                    value={filters.operation}
                    onChange={handleFilterChange}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Operations</option>
                    <option value="0">Add Operation</option>
                    <option value="1">Update Operation</option>
                    <option value="2">Delete Operation</option>
                    <option value="3">Undo Delete Operation</option>
                </select>
                <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Search
                </button>
            </form>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operation Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">Loading...</td>
                            </tr>
                        ) : operations.length > 0 ? (
                            operations.map((op, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{op.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{op.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{op.operationType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{op.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(op.timestamp).toLocaleString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No operations found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
                <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                    className={`px-4 py-2 border rounded-lg ${filters.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                    Previous
                </button>
                <span className="text-gray-700">Page {filters.page}</span>
                <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={operations.length < filters.pageSize} // Simple check for next page availability
                    className={`px-4 py-2 border rounded-lg ${operations.length < filters.pageSize ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default AdminOperations;
