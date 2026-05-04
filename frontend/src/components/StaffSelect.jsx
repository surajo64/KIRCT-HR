import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

const StaffSelect = ({ employees, onSelect, placeholder = "-- Select Staff --", selectedId, valueField = "_id" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const dropdownRef = useRef(null);

    const selectedEmployee = employees?.find(emp => emp[valueField] === selectedId);

    useEffect(() => {
        if (employees) {
            const filtered = employees.filter(emp => 
                emp.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.staffId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredEmployees(filtered);
        }
    }, [searchTerm, employees]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (emp) => {
        onSelect(emp[valueField]);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className="relative w-full text-left" ref={dropdownRef}>
            <div 
                className="w-full px-4 py-2 border rounded-md bg-white cursor-pointer flex justify-between items-center hover:border-green-500 transition-all duration-200 shadow-sm"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`truncate ${selectedEmployee ? "text-gray-800 font-medium" : "text-gray-400"}`}>
                    {selectedEmployee ? `${selectedEmployee.userId?.name || selectedEmployee.name} (${selectedEmployee.staffId})` : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-[100] w-full mt-1 bg-white border rounded-lg shadow-xl max-h-72 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                    <div className="p-3 border-b bg-gray-50 flex items-center gap-2">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            autoFocus
                            placeholder="Search by Name, ID, or Dept..."
                            className="w-full bg-transparent outline-none text-sm placeholder:text-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                        {searchTerm && (
                            <X 
                                className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSearchTerm('');
                                }}
                            />
                        )}
                    </div>
                    <div className="overflow-y-auto custom-scrollbar max-h-60">
                        <style>{`
                            .custom-scrollbar::-webkit-scrollbar {
                                width: 6px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-track {
                                background: #f1f1f1;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb {
                                background: #888;
                                border-radius: 10px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                                background: #555;
                            }
                        `}</style>
                        {filteredEmployees.length > 0 ? (
                            filteredEmployees.map((emp) => (
                                <div
                                    key={emp._id}
                                    className={`px-4 py-3 hover:bg-green-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${selectedId === emp[valueField] ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}
                                    onClick={() => handleSelect(emp)}
                                >
                                    <div className="font-semibold text-gray-800 text-sm">{emp.userId?.name || emp.name}</div>
                                    <div className="text-[11px] text-gray-500 flex justify-between mt-0.5 uppercase tracking-wider">
                                        <span>ID: <span className="text-green-700 font-medium">{emp.staffId}</span></span>
                                        <span className="truncate ml-2">Dept: <span className="text-blue-700 font-medium">{emp.department?.name || 'N/A'}</span></span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-6 text-sm text-gray-500 text-center flex flex-col items-center gap-2">
                                <Search className="w-8 h-8 text-gray-200" />
                                <span>No staff matches your search</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffSelect;
