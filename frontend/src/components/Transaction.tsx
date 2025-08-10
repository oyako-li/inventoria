import React, { useState, useEffect } from 'react';
import type { Transaction } from '../types';
import useResponsive from '../hooks/useResponsive';

const PAGE_SIZE = 5;

interface TransactionsProps {
    itemQuery: string;
    placeholder: string;
    transactionTable: Transaction[];
    supplierTable: any[];
    filter: (transaction: Transaction) => boolean;
    setItemQuery: (query: string) => void;
    handleOpenModal: (transaction: Transaction) => void;
}

const Transactions: React.FC<TransactionsProps> = ({
    itemQuery,
    placeholder,
    transactionTable,
    supplierTable,
    filter,
    setItemQuery,
    handleOpenModal,
}) => {
    const [items, setItems] = useState<Transaction[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageCount, setPageCount] = useState(0);
    const [currentPageData, setCurrentPageData] = useState<Transaction[]>([]);
    const isMobile = useResponsive();

    useEffect(() => {
        if (itemQuery !== "") {
            const filtered = transactionTable.filter(filter);
            setItems(filtered);
            setCurrentPage(0);
            setPageCount(Math.ceil(filtered.length / PAGE_SIZE));
        } else {
            setItems(transactionTable);
            setCurrentPage(0);
            setPageCount(Math.ceil(transactionTable.length / PAGE_SIZE));
        }
    }, [itemQuery, transactionTable]);

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
                    {currentPageData.map((transaction) => {
                        const supplier = supplierTable.find(s => s.supplier_code === transaction.supplier_code);
                        return (
                            <div 
                                key={transaction.id || `${transaction.item_code}-${transaction.updated_at}`} 
                                className="mobile-card"
                                onClick={() => handleOpenModal(transaction)}
                            >
                                <div className="card-header">
                                    <h3>{transaction.item_name}</h3>
                                    <span className="transaction-id">ID: {transaction.id}</span>
                                </div>
                                <div className="card-content">
                                    <div className="card-row">
                                        <span className="label">商品コード:</span>
                                        <span className="value">{transaction.item_code}</span>
                                    </div>
                                    <div className="card-row">
                                        <span className="label">取引先:</span>
                                        <span className="value">{supplier?.supplier_name || '未設定'}</span>
                                    </div>
                                    <div className="card-row">
                                        <span className="label">取引種別:</span>
                                        <span className="value">{transaction.action}</span>
                                    </div>
                                    <div className="card-row">
                                        <span className="label">数量:</span>
                                        <span className="value">{transaction.quantity}</span>
                                    </div>
                                    <div className="card-row">
                                        <span className="label">単価:</span>
                                        <span className="value">{transaction.price ? `¥${transaction.price.toLocaleString()}` : '-'}</span>
                                    </div>
                                    <div className="card-row">
                                        <span className="label">取引日時:</span>
                                        <span className="value">{transaction.updated_at}</span>
                                    </div>
                                    <div className="card-row">
                                        <span className="label">更新者:</span>
                                        <span className="value">{transaction.updated_by}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
                            <th>ID</th>
                            <th>商品コード</th>
                            <th>商品名</th>
                            <th>取引先名</th>
                            <th>取引種別</th>
                            <th>数量</th>
                            <th>単価</th>
                            <th>取引日時</th>
                            <th>更新者</th>
                        </tr>
                    </thead>
                    <tbody id="transactionTable">
                        {currentPageData.map((transaction) => {
                            // const supplier = supplierTable.find(s => s.supplier_code === transaction.supplier_code);
                            return (
                                <tr key={transaction.id || `${transaction.item_code}-${transaction.updated_at}`} onClick={() => handleOpenModal(transaction)}>
                                    <td>{transaction.id}</td>
                                    <td>{transaction.item_code}</td>
                                    <td>{transaction.item_name}</td>
                                    <td>{transaction.supplier_name || '未設定'}</td>
                                    <td>{transaction.action}</td>
                                    <td>{transaction.quantity}</td>
                                    <td>{transaction.price ? `¥${transaction.price.toLocaleString()}` : '-'}</td>
                                    <td>{transaction.updated_at}</td>
                                    <td>{transaction.updated_by}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
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
};

export default Transactions; 