import React, { useState, useEffect, useContext, useRef } from 'react';
import { toast } from "react-toastify";
import { AppContext } from '../context/AppContext';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";
import LoadingOverlay from '../components/loadingOverlay.jsx';




const criteriaList = [
    { label: "Punctuality", key: "punctuality", max: 20 },
    { label: "Productivity", key: "research", max: 20 },
    { label: "Collaboration", key: "teamwork", max: 15 },
    { label: "Initiative/Invention", key: "initiative", max: 15 },
    { label: "Professionalism", key: "professionalism", max: 15 },
    { label: "Communication", key: "communication", max: 15 },
];

const adminEvaluation = () => {


    const { token, getAllEmployees, fetchKpi, kpi, setKpi, employees, getAllEvaluations, evaluations, setEvaluations, backendUrl } = useContext(AppContext);
    const [userId, setUserId] = useState(null); // for saving selected user's ID
    const [isLoading, setIsLoading] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredEvaluations, setFilteredEvaluations] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5
    const [scores, setScores] = useState({});
    const [comments, setComments] = useState("");
    const [month, setMonth] = useState("");
    const [year, setYear] = useState("");
    const [employeeName, setEmployeeName] = useState("");
    const formRef = useRef();

    const handleScoreChange = (key, value) => {
        setScores({ ...scores, [key]: Number(value) });
    };

    const getTotalScore = () => {
        const total = Object.values(scores).reduce((acc, val) => acc + val, 0);
        return total;
    };
    const getMaxScore = () =>
        criteriaList.reduce((total, { max }) => total + max, 0);

    const getGrade = () => {
        const total = getTotalScore();
        const max = getMaxScore();
        const percentage = (total / max) * 100;

        if (percentage >= 80) return "Excelence";
        if (percentage >= 70) return "Very Good";
        if (percentage >= 60) return "Good";
        if (percentage >= 50) return "fair";
        return "Poor";
    };

    const generatePDF = async () => {
        const canvas = await html2canvas(formRef.current);
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF();
        pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
        pdf.save(`${employeeName}_Performance_Evaluation.pdf`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        const userId = selectedRecords.hodEvaluation.userId._id || selectedRecords?.employeeId;
        const kpiId = selectedRecords.kpi._id
        const evaluationId = selectedRecords.hodEvaluation._id

        const formData = {
            userId,
            scores,
            kpiId,
            evaluationId,
            total: getTotalScore(),
            grade: getGrade(),
            comments,
            year: new Date().getFullYear(),
            month,

        };
       

            if (!userId || !scores || formData.total == null || !formData.grade || !kpiId) {
                toast.error("Missing required field. Please fill all evaluation inputs.");
                return;
            }
 try {
            if (isEditing) {


                const { data } = await axios.post(
                    backendUrl + '/api/admin/update-admin-evaluation',
                    { adminEvaluationId: selectedRecords.adminEvaluation._id, ...formData },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (data.success) {
                    toast.success("Evaluation updated successfully!");
                    resetForm();

                    // ✅ Refresh selectedRecords.hodEvaluation manually
                    const updatedEval = {
                        ...formData,
                        createdAt: new Date().toISOString(),
                    };

                    setSelectedRecords(prev => ({
                        ...prev,
                        adminEvaluation: updatedEval
                    }));
                    getAllEvaluations();

                }
            } else {
                const { data } = await axios.post(
                    backendUrl + "/api/admin/admin-evaluation",
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (data.success) {
                    toast.success("Evaluation Submited successfully!");

                    // Reset state
                    // ✅ Refresh selectedRecords.hodEvaluation manually
                    const updatedEval = {
                        ...formData,
                        createdAt: new Date().toISOString(),
                    };

                    setSelectedRecords(prev => ({
                        ...prev,
                        adminEvaluation: updatedEval
                    }));
                    resetForm();
                    getAllEvaluations();

                } else {
                    toast.error(data.message);
                }
            }
        } catch (error) {
        }
        finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setIsEditing(null);
        setEmployeeName('');
        setScores({});
        setComments('');
        setMonth('');
        setYear('');
    };


    const handleAddNew = () => {
        setIsEditing(null);
        setShowForm(true);
    };




    useEffect(() => {
        if (token)
            getAllEvaluations();
        fetchKpi();
    }, [token]);


    const handleView = (item) => {
        setIsLoading(true);
        setTimeout(() => {
            setShowDetail(true);
            setSelectedRecords(item)
            setIsLoading(false);
        }, 300);
    };


    const handleClose = () => {
        setIsLoading(true);
        setTimeout(() => {
            // Reset state
            setShowDetail(false)
            setShowForm(false);
            setIsEditing(false);
            setYear('')
            setMonth('')
            setScores({});
            setComments('');
            getAllEvaluations();
            setIsLoading(false);
        }, 300);
    }


    useEffect(() => {
        const filtered = (evaluations || []).filter((d) =>
            (d.hodEvaluation.userId?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredEvaluations(filtered);
        setCurrentPage(1); // Reset to first page on new search
    }, [searchTerm, evaluations]);

    // Pagination logic
    const totalItems = evaluations?.length;
    const totalPages = Math.ceil(filteredEvaluations.length / itemsPerPage);
    const paginatedEvaluations = filteredEvaluations.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );



if (!paginatedEvaluations) return <LoadingOverlay />;
    return (
        <div className='w-full max-w-6xl m-5 text-center'>
            <p className="text-2xl font-bold text-gray-800">MANAGE EVALUATION</p>

            <div className='flex justify-between items-center mt-4'>
                <input
                    type='text'
                    placeholder='Search by Employee Name...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='mb-6 px-4 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-1/4'
                />

            </div>

            <div className='bg-white border-rounded text-sm max-h-[80vh] min-h-[60vh] overflow-scroll'>
                <div className='bg-gray-200 hidden sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_1fr_1fr_2fr_1fr] py-3 px-6 rounded-xl border-b-4 border-green-500'>
                    <p>#</p>
                    <p>Employee</p>
                    <p>Self Rating (KPI)</p>
                    <p>HOD Rating</p>
                    <p>HR Rating</p>
                    <p>Final Grade</p>
                    <p>Comments</p>
                    <p>Actions</p>
                </div>

                {paginatedEvaluations.length > 0 ? (
                    paginatedEvaluations.map((item, index) => (
                        <div key={index} className="flex flex-wrap justify-between sm:grid sm:grid-cols-[0.5fr_2fr_1fr_1fr_1fr_1fr_2fr_1fr] items-center text-gray-600 py-3 px-6 border-b hover:bg-blue-50">
                            <p>{(currentPage - 1) * itemsPerPage + index + 1}</p>
                            <p>{item.hodEvaluation.userId?.name}</p>
                            {/* Self Rating */}
                            <p>{item.kpi?.total || "N/A"}%</p>

                            {/* HOD Rating */}
                            <p>
                                {item.hodEvaluation
                                    ? `${item.hodEvaluation.total}% (${item.hodEvaluation.grade})`
                                    : "Not submitted"}
                            </p>

                            {/* Admin Rating */}
                            <p>
                                {item.adminEvaluation
                                    ? `${item.adminEvaluation.total}% (${item.adminEvaluation.grade})`
                                    : "Not submitted"}
                            </p>

                            <p>
                                {item.adminEvaluation
                                    ? `${item.adminEvaluation.grade}`
                                    : "Not submitted"}
                            </p>
                            <p className="truncate max-w-[200px]">{item.adminEvaluation?.comments || 'Not commented'}</p>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => handleView(item)}
                                    className={`text-white text-sm px-3 py-1 rounded-full ${item.adminEvaluation ? 'bg-blue-500' : 'bg-green-600'
                                        }`}
                                >
                                    {item.adminEvaluation ? "View Detail" : "Evaluate"}
                                </button>

                            </div>

                        </div>
                    ))
                ) : (
                    <p className="text-center py-5 text-gray-500">No KPI found.</p>
                )}

                {totalPages > 1 && (
                    <>


                        {/* Pagination controls */}
                        <div className="flex justify-center items-center mt-2 gap-2">
                            <button
                                onClick={() => {
                                    setIsLoading(true);
                                    setTimeout(() => {
                                        setCurrentPage(prev => Math.max(prev - 1, 1))
                                        setIsLoading(false);
                                    }, 300);
                                }}
                                disabled={currentPage === 1}
                                className="text-white px-3 py-1 bg-blue-500 hover:bg-blue-800 rounded disabled:opacity-50">
                                Prev
                            </button>

                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => {
                                    setIsLoading(true);
                                    setTimeout(() => {
                                        setCurrentPage(prev => Math.min(prev + 1, totalPages))
                                        setIsLoading(false);
                                    }, 300);
                                }}
                                disabled={currentPage === totalPages}
                                className="text-white px-3 py-1 bg-blue-500 hover:bg-blue-800 rounded disabled:opacity-50">
                                Next
                            </button>
                        </div>
                        <div className="flex justify-end mt-2 text-sm  text-gray-800">
                            Showing {(currentPage - 1) * itemsPerPage + 1}–
                            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
                        </div>
                    </>
                )}
            </div>


            {showDetail && selectedRecords && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-6xl relative overflow-auto max-h-[95vh]">
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-xl font-bold"
                        >
                            ✕
                        </button>

                        <h2 className="text-2xl font-bold text-center text-gray-700">
                            Evaluation Summary For
                            <span className="text-green-700 ml-2">
                                {selectedRecords.hodEvaluation?.userId.name}
                            </span>
                        </h2>
                        <h3 className="text-lg font-semibold mb-6 text-center text-blue-700">
                            {selectedRecords.hodEvaluation?.month} {selectedRecords.hodEvaluation?.year}
                        </h3>


                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* ✅ LEFT COLUMN: KPI + HOD Evaluation */}
                            <div className="col-span-1 border rounded-lg p-4 bg-gray-50 shadow-inner overflow-auto max-h-[600px]">
                                {/* Employee KPI */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-green-600 mb-4">Employee KPI</h3>

                                    <table className="w-full text-sm text-start border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                        <tbody>


                                            <tr className="bg-gray-50 border-b">
                                                <td className="px-4 py-2 font-medium text-gray-600">Punctuality</td>
                                                <td className="px-4 py-2">{selectedRecords.kpi?.scores.punctuality}</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="px-4 py-2 font-medium text-gray-600">Productivity</td>
                                                <td className="px-4 py-2">{selectedRecords.kpi?.scores.research || 'N/A'}</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="px-4 py-2 font-medium text-gray-600">Collaborations</td>
                                                <td className="px-4 py-2">{selectedRecords.kpi?.scores.teamwork}</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="px-4 py-2 font-medium text-gray-600">Initiative</td>
                                                <td className="px-4 py-2">{selectedRecords.kpi?.scores.initiative}</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="px-4 py-2 font-medium text-gray-600">Professionalism</td>
                                                <td className="px-4 py-2">{selectedRecords.kpi?.scores.professionalism}</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="px-4 py-2 font-medium text-gray-600">Communication</td>
                                                <td className="px-4 py-2">{selectedRecords.kpi?.scores.communication}</td>
                                            </tr>
                                            <tr className="bg-gray-50 border-b">
                                                <td className="px-4 py-2 font-semibold text-black">Total Score</td>
                                                <td className="px-4 py-2 font-semibold text-black">{selectedRecords.kpi.total} / 100</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="px-4 py-2 font-bold">Grade</td>
                                                <td className={`px-4 py-2 font-bold 
                                                             ${selectedRecords.kpi?.total >= 80
                                                        ? 'text-green-600'
                                                        : selectedRecords.kpi?.total >= 70
                                                            ? 'text-blue-600'
                                                            : selectedRecords.kpi?.total >= 60
                                                                ? 'text-yellow-600'
                                                                : 'text-red-600'
                                                    }`}
                                                >
                                                    {selectedRecords.kpi?.grade}
                                                </td>

                                            </tr>
                                            <tr className="border-b">
                                                <td className="px-4 py-2 font-medium text-gray-600">Comments</td>
                                                <td className="px-4 py-2">{selectedRecords.kpi?.comments}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                            </div>

                            {/* ✅ MIDDLE COLUMN: HOD Evaluation */}
                            <div className="col-span-1 border rounded-lg p-4 bg-gray-50 shadow-inner overflow-auto max-h-[600px]">
                                {/* Employee KPI */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-green-600 mb-4">HOD Evaluation Detail</h3>

                                    <table className="w-full text-sm text-start border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                        <tbody>



                                            <tr className="bg-gray-50 border-b">
                                                <td className="px-4 py-2 font-medium text-gray-600">Punctuality</td>
                                                <td className="px-4 py-2">{selectedRecords.hodEvaluation?.scores.punctuality}</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="px-4 py-2 font-medium text-gray-600">Productivity</td>
                                                <td className="px-4 py-2">{selectedRecords.hodEvaluation?.scores.research || 'N/A'}</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="px-4 py-2 font-medium text-gray-600">Collaborations</td>
                                                <td className="px-4 py-2">{selectedRecords.hodEvaluation?.scores.teamwork}</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="px-4 py-2 font-medium text-gray-600">Initiative</td>
                                                <td className="px-4 py-2">{selectedRecords.hodEvaluation?.scores.initiative}</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="px-4 py-2 font-medium text-gray-600">Professionalism</td>
                                                <td className="px-4 py-2">{selectedRecords.hodEvaluation?.scores.professionalism}</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="px-4 py-2 font-medium text-gray-600">Communication</td>
                                                <td className="px-4 py-2">{selectedRecords.hodEvaluation?.scores.communication}</td>
                                            </tr>
                                            <tr className="bg-gray-50 border-b">
                                                <td className="px-4 py-2 font-semibold text-black">Total Score</td>
                                                <td className="px-4 py-2 font-semibold text-black">{selectedRecords.hodEvaluation.total} / 100</td>
                                            </tr>

                                            <tr className="border-b">
                                                <td className="px-4 py-2 font-bold">Grade</td>
                                                <td className={`px-4 py-2 font-bold 
                                                             ${selectedRecords.hodEvaluation.total >= 80
                                                        ? 'text-green-600'
                                                        : selectedRecords.hodEvaluation.total >= 70
                                                            ? 'text-blue-600'
                                                            : selectedRecords.hodEvaluation.total >= 60
                                                                ? 'text-yellow-600'
                                                                : 'text-red-600'
                                                    }`}
                                                >
                                                    {selectedRecords.hodEvaluation.grade}
                                                </td>

                                            </tr>
                                            <tr className="border-b">
                                                <td className="px-4 py-2 font-medium text-gray-600">Comments</td>
                                                <td className="px-4 py-2">{selectedRecords.hodEvaluation?.comments}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="col-span-1 border rounded-lg p-4 bg-gray-50 shadow-inner overflow-auto max-h-[600px]">
                                <div className="mb-6">
                                    {selectedRecords.adminEvaluation && !isEditing ? (
                                        <>
                                            <h3 className="text-lg font-bold mb-4 text-green-600 text-center">HR Evaluation</h3>
                                            <table className="w-full text-sm text-left border border-gray-200 rounded-lg bg-white shadow">
                                                <tbody>


                                                    <tr className="bg-gray-50 border-b">
                                                        <td className="px-4 py-2 font-medium text-gray-600">Punctuality</td>
                                                        <td className="px-4 py-2">{selectedRecords.adminEvaluation.scores?.punctuality}</td>
                                                    </tr>
                                                    <tr className="border-b">
                                                        <td className="px-4 py-2 font-medium text-gray-600">Productivity</td>
                                                        <td className="px-4 py-2">{selectedRecords.adminEvaluation.scores?.research}</td>
                                                    </tr>
                                                    <tr className="bg-gray-50 border-b">
                                                        <td className="px-4 py-2 font-medium text-gray-600">Teamwork</td>
                                                        <td className="px-4 py-2">{selectedRecords.adminEvaluation.scores?.teamwork}</td>
                                                    </tr>
                                                    <tr className="border-b">
                                                        <td className="px-4 py-2 font-medium text-gray-600">Initiative</td>
                                                        <td className="px-4 py-2">{selectedRecords.adminEvaluation.scores?.initiative}</td>
                                                    </tr>
                                                    <tr className="bg-gray-50 border-b">
                                                        <td className="px-4 py-2 font-medium text-gray-600">Professionalism</td>
                                                        <td className="px-4 py-2">{selectedRecords.adminEvaluation.scores?.professionalism}</td>
                                                    </tr>
                                                    <tr className="border-b">
                                                        <td className="px-4 py-2 font-medium text-gray-600">Communication</td>
                                                        <td className="px-4 py-2">{selectedRecords.adminEvaluation.scores?.communication}</td>
                                                    </tr>
                                                    <tr className="bg-gray-50 border-b">
                                                        <td className="px-4 py-2 font-semibold text-black">Total Score</td>
                                                        <td className="px-4 py-2 font-semibold text-black">{selectedRecords.adminEvaluation.total} / 100</td>
                                                    </tr>
                                                    <tr className="border-b">
                                                        <td className="px-4 py-2 font-bold">Grade</td>
                                                        <td className={`px-4 py-2 font-bold 
                                                             ${selectedRecords.adminEvaluation.total >= 80
                                                                ? 'text-green-600'
                                                                : selectedRecords.adminEvaluation.total >= 70
                                                                    ? 'text-blue-600'
                                                                    : selectedRecords.adminEvaluation.total >= 60
                                                                        ? 'text-yellow-600'
                                                                        : 'text-red-600'
                                                            }`}
                                                        >
                                                            {selectedRecords.adminEvaluation.grade}
                                                        </td>

                                                    </tr>
                                                    <tr className="bg-gray-50 border-b">
                                                        <td className="px-4 py-2 font-medium text-gray-600">Comments</td>
                                                        <td className="px-4 py-2">{selectedRecords.adminEvaluation.comments || 'N/A'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-4 py-2 font-medium text-gray-600">Evaluated On</td>
                                                        <td className="px-4 py-2">{new Date(selectedRecords.adminEvaluation.createdAt).toLocaleDateString()}</td>
                                                    </tr>
                                                </tbody>
                                            </table>


                                            {/* ✅ Update Button */}
                                            <div className="mt-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        setIsLoading(true);
                                                        setTimeout(() => {
                                                            setIsEditing(true);
                                                            setMonth(selectedRecords.adminEvaluation.month);
                                                            setYear(selectedRecords.adminEvaluation.year);
                                                            setComments(selectedRecords.adminEvaluation.comments || '');
                                                            setScores(selectedRecords.adminEvaluation.scores || {});
                                                            setIsEditing({ _id: selectedRecords.adminEvaluation._id }); // useful for PATCH/POST
                                                            setIsLoading(false);
                                                        }, 300);
                                                    }}
                                                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                                                >
                                                    Update Evaluation
                                                </button>
                                            </div>

                                        </>

                                    ) : (
                                        // ✅ Form for New or Editing
                                        <form onSubmit={handleSubmit}>
                                            <h3 className="text-lg font-bold mb-2 text-green-600 text-center">Admin Evaluation</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                                {/* Month */}
                                                <div>
                                                    <label className="block font-medium mb-0.5">Evaluation Month</label>
                                                    <select
                                                        value={month}
                                                        onChange={(e) => setMonth(e.target.value)}
                                                        required
                                                        className="w-full px-3 py-1 border rounded-md"
                                                    >
                                                        <option value="">Select Month</option>
                                                        {[
                                                            "January", "February", "March", "April", "May", "June",
                                                            "July", "August", "September", "October", "November", "December"
                                                        ].map((m) => (
                                                            <option key={m} value={m}>{m}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Year */}
                                                <div>
                                                    <label className="block font-medium mb-0.5">Evaluation Year</label>
                                                    <input
                                                        type="number"
                                                        value={year}
                                                        onChange={(e) => setYear(e.target.value)}
                                                        className="w-full px-3 py-1 border rounded-md"
                                                        min="2000"
                                                        max={new Date().getFullYear() + 1}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {/* Criteria Inputs */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                                {criteriaList.map(({ label, key, max }) => (
                                                    <div key={key}>
                                                        <label className="block font-medium mb-0.5">{label} (Max: {max})</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={max}
                                                            value={scores[key] || ''}
                                                            onChange={(e) => handleScoreChange(key, e.target.value)}
                                                            className="w-full px-3 py-1 border rounded-md"
                                                            required
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Comments */}
                                            <textarea
                                                value={comments}
                                                onChange={(e) => setComments(e.target.value)}
                                                placeholder="Evaluator's Comments"
                                                className="w-full px-3 py-1 border rounded-md"
                                                rows={3}
                                            ></textarea>

                                            {/* Total + Grade */}
                                            <div className="flex justify-between items-center mb-4">
                                                <div><strong>Total Score:</strong> {getTotalScore()} / 100</div>
                                                <div><strong>Grade:</strong> {getGrade()}</div>
                                            </div>

                                            {/* Submit Button */}
                                            <button
                                                type="submit"
                                                className="w-full bg-green-600 text-white py-2 rounded-md font-semibold hover:bg-green-700 transition"
                                            >
                                                {isEditing ? 'Update Evaluation' : 'Submit Evaluation'}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>


                        </div>
                    </div>
                </div>
            )
            }
            {isLoading && <LoadingOverlay />}

        </div >
    );
};

export default adminEvaluation;
