import React, { useState, useEffect } from 'react';
import type { Supplier, ActionType } from '../types';

const PAGE_SIZE = 5;

interface SupplierProps {
    itemQuery: string;
    placeholder: string;
    supplierTable: Supplier[];
    supplierType: ActionType;
    filter: (supplier: Supplier) => boolean;
    setItemQuery: (query: string) => void;
    handleOpenModal: (supplier: Supplier) => void;
}

const SupplierTable: React.FC<SupplierProps> = ({
    itemQuery,
    placeholder,
    supplierTable,
    supplierType,
    filter,
    setItemQuery,
    handleOpenModal,
}) => {
    const [items, setItems] = useState<Supplier[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageCount, setPageCount] = useState(0);
    const [currentPageData, setCurrentPageData] = useState<Supplier[]>([]);

    useEffect(() => {
        const filtered = supplierTable.filter(filter);
        setItems(filtered);
        setCurrentPage(0);
        setPageCount(Math.ceil(filtered.length / PAGE_SIZE));        
    }, [itemQuery, supplierType, supplierTable]);

    useEffect(() => {
        setCurrentPageData(items.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE));
    }, [items, currentPage]);


    return (
        <>
            <div className="form-group search-form">
                <input
                    type="text"
                    id="productName"
                    placeholder={placeholder}
                    value={itemQuery}
                    onChange={(e) => setItemQuery(e.target.value)}
                />
            </div>
            <table className="inventory-table">
                <thead>
                    <tr>
                        <th>顧客コード</th>
                        <th>顧客名</th>
                        <th>顧客種別</th>
                        <th>顧客住所</th>
                        <th>顧客説明</th>
                        <th>最終更新</th>
                        <th>更新者</th>
                    </tr>
                </thead>
                <tbody>
                    {currentPageData.map((supplier) => (
                        <tr key={supplier.supplier_code} onClick={() => handleOpenModal(supplier)}>
                            <td>{supplier.supplier_code}</td>
                            <td>{supplier.supplier_name}</td>
                            <td>{supplier.supplier_type}</td>
                            <td>{supplier.supplier_address}</td>
                            <td>{supplier.supplier_description}</td>
                            <td>{supplier.updated_at}</td>
                            <td>{supplier.updated_by}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div style={{ marginTop: "20px", textAlign: "center" }}>
                <div className="pagination-controls">
                    <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}>
                        前へ
                    </button>
                    <span>
                        {currentPage + 1} / {pageCount || 1}
                    </span>
                    <button onClick={() => setCurrentPage(p => Math.min(pageCount - 1, p + 1))} disabled={currentPage >= pageCount - 1}>
                        次へ
                    </button>
                </div>
            </div>
        </>
    );
};

export default SupplierTable; 