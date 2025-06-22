import React, { useState, useEffect } from 'react';
import type { Transaction } from '../types';

const PAGE_SIZE = 5;

interface TransactionsProps {
    itemQuery: string;
    placeholder: string;
    transactionTable: Transaction[];
    filter: (transaction: Transaction) => boolean;
    setItemQuery: (query: string) => void;
    handleOpenModal: (transaction: Transaction) => void;
}

const Transactions: React.FC<TransactionsProps> = ({
    itemQuery,
    placeholder,
    transactionTable,
    filter,
    setItemQuery,
    handleOpenModal,
}) => {
    const [items, setItems] = useState<Transaction[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageCount, setPageCount] = useState(0);
    const [currentPageData, setCurrentPageData] = useState<Transaction[]>([]);

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
                        <th>ID</th>
                        <th>商品コード</th>
                        <th>商品名</th>
                        <th>取引先コード</th>
                        <th>取引種別</th>
                        <th>数量</th>
                        <th>単価</th>
                        <th>取引日時</th>
                        <th>更新者</th>
                    </tr>
                </thead>
                <tbody id="transactionTable">
                    {currentPageData.map((transaction) => (
                        <tr key={transaction.id} onClick={() => handleOpenModal(transaction)}>
                            <td>{transaction.id}</td>
                            <td>{transaction.item_code}</td>
                            <td>{transaction.item_name}</td>
                            <td>{transaction.supplier_code}</td>
                            <td>{transaction.action}</td>
                            <td>{transaction.quantity}</td>
                            <td>{transaction.price}</td>
                            <td>{transaction.updated_at}</td>
                            <td>{transaction.updated_by}</td>
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

export default Transactions; 