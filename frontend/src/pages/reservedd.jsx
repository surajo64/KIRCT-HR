import React, { useState, useEffect, useContext, useRef } from 'react';
import { toast } from "react-toastify";
import { AppContext } from '../context/AppContext';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";




const criteriaList = [
    { label: "Punctuality", key: "punctuality", max: 20 },
    { label: "Productivity", key: "research", max: 20 },
    { label: "Collaboration", key: "teamwork", max: 15 },
    { label: "Initiative", key: "initiative", max: 15 },
    { label: "Professionalism", key: "professionalism", max: 15 },
    { label: "Communication", key: "communication", max: 15 },
];

const reserved = () => {


    const { token, getAllEmployees, employees, getAllEvaluations, evaluations, setEvaluations, backendUrl } = useContext(AppContext);
    const [userId, setUserId] = useState(null); // for saving selected user's ID
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedAdminId, setSelectedAdminId] = useState(null);
    const [designations, setDesignations] = useState(['']);
    const [showDetail, setShowDetail] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredEvaluations, setFilteredEvaluations] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5
    const [editingEvaluationId, setEditingEvaluationId] = useState(null);
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

        const formData = {
            userId,
            scores,
            total: getTotalScore(),
            grade: getGrade(),
            comments,
            year,
            month,

        };

        if (editingAdmin && editingAdmin._id) {
            const { data } = await axios.post(
                backendUrl + '/api/admin/update-evaluation',
                { evaluationId: editingAdmin._id, ...formData },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                toast.success("Evaluation updated successfully!");
                // Reset state
                setShowForm(false);
                setEditingAdmin(false);
                setEmployeeName('');
                setScores({});
                setComments('');
                setMonth('');
                setYear('');
                setEditingAdmin(null);
                getAllEvaluations();

            }
        } else {
            const { data } = await axios.post(
                backendUrl + "/api/admin/evaluation",
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                toast.success("Evaluation Submited successfully!");

                // Reset state
                setShowForm(false);
                setEditingAdmin(false);
                setEmployeeName('');
                setScores({});
                setComments('');
                setMonth('');
                setYear('');
                setEditingAdmin(null);
                getAllEvaluations();

            } else {
                toast.error(data.message);
            }
        }
    };


    const handleAddNew = () => {
        setEditingAdmin(null);
        setShowForm(true);
    };


    const handleUpdate = (item) => {
        setEditingAdmin(item); // Store the full object, not just ID
        setShowForm(true);

        setEmployeeName(item.userId.name || '');
        setComments(item.comments || '');
        setMonth(item.month || '');
        setYear(item.year || '');
        setScores({
            punctuality: item.scores?.punctuality || 0,
            research: item.scores?.research || 0,
            teamwork: item.scores?.teamwork || 0,
            initiative: item.scores?.initiative || 0,
            professionalism: item.scores?.professionalism || 0,
            communication: item.scores?.communication || 0,
        });
    };




    useEffect(() => {
        if (token)
            getAllEvaluations();
    }, [token]);


    const handleView = (item) => {
        setShowDetail(true);
        setSelectedRecords(item)
    };

    const handleClose = () => {

        // Reset state
        setShowForm(false);
        setEditingAdmin(false);
        setEmployeeName('');
        setScores({});
        setComments('');
        setEditingAdmin(null);
        getAllEvaluations();

    }


    useEffect(() => {
        const filtered = (evaluations || []).filter((d) =>
            (d.userId?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
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

                <button
                    onClick={handleAddNew}
                    className="bg-green-500 text-white py-2 px-4 rounded-md text-sm hover:bg-green-600 transition mb-6"
                >
                    Add Evaluation
                </button>
            </div>

            <div className='bg-white border-rounded text-sm max-h-[80vh] min-h-[60vh] overflow-scroll'>
                <div className='bg-gray-200 hidden sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_2fr] py-3 px-6 rounded-xl border-b-4 border-green-500'>
                    <p>#</p>
                    <p>Employee</p>
                    <p>Total Score</p>
                    <p>Grade</p>
                    <p>Comments</p>
                    <p>Actions</p>
                </div>

                {paginatedEvaluations.length > 0 ? (
                    paginatedEvaluations.map((item, index) => (
                        <div key={index} className="flex flex-wrap justify-between sm:grid sm:grid-cols-[0.5fr_2fr_1fr_1fr_3fr_2fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-blue-50">
                            <p>{(currentPage - 1) * itemsPerPage + index + 1}</p>
                            <p>{item.userId?.name}</p>
                            <p>{item.total}</p>
                            <p>{item.grade}</p>
                            <p>{item.comments}</p>
                            <div className="flex justify-end gap-2">
                            
                                <button
                                    onClick={() => handleView(item)}
                                    className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full"
                                >
                                    Evaluate
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center py-5 text-gray-500">No Evaluations found.</p>
                )}

                {totalPages > 1 && (
                    <>


                        {/* Pagination controls */}
                        <div className="flex justify-center items-center mt-2 gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md relative">
                        <button onClick={handleClose} className="font-bold text-3xl absolute top-2 right-4 text-red-700 hover:text-red-800">✕</button>
                        <h2 className="text-2xl font-bold text-center mb-6 text-gray-700">
                            {editingAdmin ? "Update Evaluation" : "Submit New Evaluation"}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={employeeName}
                                    onChange={async (e) => {
                                        const value = e.target.value || '';
                                        setEmployeeName(value);

                                        if (value.trim().length > 1) {
                                            try {
                                                const res = await axios.get(`${backendUrl}/api/admin/search-users?query=${value}`, {
                                                    headers: { Authorization: `Bearer ${token}` },
                                                });

                                                if (res.data.success) {
                                                    setSearchResults(res.data.users);
                                                    setShowDropdown(true);
                                                    console.log("Search Result:", res.data.users)
                                                }
                                            } catch (error) {
                                                console.error("Search error:", error);
                                                setShowDropdown(false);
                                            }
                                        } else {
                                            setShowDropdown(false);
                                        }
                                    }}

                                    placeholder="Search employee name"
                                    required
                                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                />


                                {showDropdown && Array.isArray(searchResults) && searchResults.length > 0 && (
                                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md max-h-40 overflow-y-auto shadow-md">
                                        {searchResults.map((user) => (
                                            <li
                                                key={user._id}
                                                onClick={() => {
                                                    setEmployeeName(user.name);
                                                    setUserId(user._id);
                                                    setShowDropdown(false);
                                                }}
                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                            >
                                                {user.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}

                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block font-medium mb-1">Evaluation Month</label>
                                    <select
                                        value={month}
                                        onChange={(e) => setMonth(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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

                                <div>
                                    <label className="block font-medium mb-1">Evaluation Year</label>
                                    <input
                                        type="number"
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        min="2000"
                                        max={new Date().getFullYear() + 1}
                                        required
                                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            </div>


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                {criteriaList.map(({ label, key, max }) => (
                                    <div key={key}>
                                        <label className="block font-medium mb-1">
                                            {label} (Max: {max})
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            max={max}
                                            value={scores[key]} // ← Add this line
                                            onChange={(e) => handleScoreChange(key, e.target.value)}
                                            className="w-full p-2 border rounded"
                                            required />
                                    </div>
                                ))}
                            </div>

                            <textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder="Evaluator's Comments"
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                rows={3}
                            ></textarea>

                            <div className="flex justify-between items-center mb-4">
                                <div><strong>Total Score:</strong> {getTotalScore()} / 100</div>
                                <div><strong>Grade:</strong> {getGrade()}</div>
                            </div>

                            <div className="flex gap-4">

                                <button
                                    type="submit"
                                    className="w-full bg-green-500 text-white py-2 rounded-md font-semibold hover:bg-green-600 transition"
                                >
                                    {editingAdmin ? "Update Evaluation" : "Submit Evaluation"}
                                </button>

                            </div>
                        </form>


                    </div>
                </div>
            )
            }


           {/* Modal */}
{showDetail && selectedRecords && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-2xl relative">
      <button
        onClick={() => setShowDetail(false)}
        className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-xl font-bold"
      >
        ✕
      </button>

      <h2 className="text-2xl font-bold mb-6 text-center text-green-700">Evaluation Details</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border border-gray-200 rounded-lg">
          <tbody>
            <tr className="border-b">
              <td className="px-4 py-2 font-medium text-gray-600">Employee</td>
              <td className="px-4 py-2">{selectedRecords.userId?.name || selectedRecords.employeeName}</td>
            </tr>
            <tr className="bg-gray-50 border-b">
              <td className="px-4 py-2 font-medium text-gray-600">Punctuality</td>
              <td className="px-4 py-2">{selectedRecords?.scores?.punctuality}</td>
            </tr>
            <tr className="border-b">
              <td className="px-4 py-2 font-medium text-gray-600">Research</td>
              <td className="px-4 py-2">{selectedRecords?.scores?.research}</td>
            </tr>
            <tr className="bg-gray-50 border-b">
              <td className="px-4 py-2 font-medium text-gray-600">Teamwork</td>
              <td className="px-4 py-2">{selectedRecords?.scores?.teamwork}</td>
            </tr>
            <tr className="border-b">
              <td className="px-4 py-2 font-medium text-gray-600">Initiative</td>
              <td className="px-4 py-2">{selectedRecords?.scores?.initiative}</td>
            </tr>
            <tr className="bg-gray-50 border-b">
              <td className="px-4 py-2 font-medium text-gray-600">Professionalism</td>
              <td className="px-4 py-2">{selectedRecords?.scores?.professionalism}</td>
            </tr>
            <tr className="border-b">
              <td className="px-4 py-2 font-medium text-gray-600">Communication</td>
              <td className="px-4 py-2">{selectedRecords?.scores?.communication}</td>
            </tr>
            <tr className="bg-gray-50 border-b">
              <td className="px-4 py-2 font-medium text-gray-600">Total Score</td>
              <td className="px-4 py-2 font-semibold text-black">{selectedRecords?.total} / 100</td>
            </tr>
            <tr className="border-b">
              <td className="px-4 py-2 font-medium text-gray-600">Grade</td>
              <td className="px-4 py-2 font-bold text-green-600">{selectedRecords?.grade}</td>
            </tr>
            <tr className="bg-gray-50 border-b">
              <td className="px-4 py-2 font-medium text-gray-600">Comments</td>
              <td className="px-4 py-2">{selectedRecords?.comments || 'N/A'}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-medium text-gray-600">Evaluated On</td>
              <td className="px-4 py-2">
                {new Date(selectedRecords?.createdAt).toLocaleDateString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}


        </div >
    );
};

export default reserved;
