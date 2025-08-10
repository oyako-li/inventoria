import React, { useState, useEffect } from 'react';
import type { Product } from '../types';
import useResponsive from '../hooks/useResponsive';

const PAGE_SIZE = 5;

interface InventoryViewProps {
    itemQuery: string;
    placeholder: string;
    productTable: Product[];
    filter: (product: Product) => boolean;
    setItemQuery: (query: string) => void;
    handleOpenModal: (product: Product) => void;
}

const InventoryView: React.FC<InventoryViewProps> = ({
    itemQuery,
    placeholder,
    productTable,
    filter,
    setItemQuery,
    handleOpenModal,
}) => {
    const [items, setItems] = useState<Product[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageCount, setPageCount] = useState(0);
    const [currentPageData, setCurrentPageData] = useState<Product[]>([]);
    const isMobile = useResponsive();

    useEffect(() => {
        if (itemQuery !== "") {
            const filtered = productTable.filter(filter);
            setItems(filtered);
            setCurrentPage(0);
            setPageCount(Math.ceil(filtered.length / PAGE_SIZE));
        } else {
            setItems(productTable);
            setCurrentPage(0);
            setPageCount(Math.ceil(productTable.length / PAGE_SIZE));
        }
    }, [itemQuery, productTable]);

    useEffect(() => {
        setCurrentPageData(items.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE));
    }, [items, currentPage]);

    if (isMobile) {
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
                <div className="mobile-cards">
                    {currentPageData.map((product) => (
                        <div 
                            key={product.item_code} 
                            className="mobile-card"
                            onClick={() => handleOpenModal(product)}
                        >
                            <div className="card-header">
                                <h3>{product.item_name}</h3>
                                <span className="qr-code">{product.item_code}</span>
                            </div>
                            <div className="card-content">
                                <div className="card-row">
                                    <span className="label">在庫数:</span>
                                    <span className="value">{product.item_quantity}</span>
                                </div>
                                <div className="card-row">
                                    <span className="label">最終更新:</span>
                                    <span className="value">{product.updated_at}</span>
                                </div>
                                <div className="card-row">
                                    <span className="label">更新者:</span>
                                    <span className="value">{product.updated_by}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
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
    }

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
            <div className="table-responsive">
                <table className="inventory-table">
                    <thead>
                        <tr>
                            <th>商品コード</th>
                            <th>商品名</th>
                            <th>在庫数</th>
                            <th>最終更新</th>
                            <th>更新者</th>
                        </tr>
                    </thead>
                    <tbody id="inventoryTable">
                        {currentPageData.map((product) => (
                            <tr key={product.item_code} onClick={() => handleOpenModal(product)}>
                                <td>{product.item_code}</td>
                                <td>{product.item_name}</td>
                                <td>{product.item_quantity}</td>
                                <td>{product.updated_at}</td>
                                <td>{product.updated_by}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={{ marginTop: "20px", textAlign: "center" }}>
                <div className="pagination-controls">
                    <button 
                        className="pagination-btn"
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))} 
                        disabled={currentPage === 0}
                    >
                        前へ
                    </button>
                    <span className="pagination-info">
                        {currentPage + 1} / {pageCount || 1}
                    </span>
                    <button 
                        className="pagination-btn"
                        onClick={() => setCurrentPage(p => Math.min(pageCount - 1, p + 1))} 
                        disabled={currentPage >= pageCount - 1}
                    >
                        次へ
                    </button>
                </div>
            </div>
        </>
    );
};

export default InventoryView; 