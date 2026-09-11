import { useState, useRef, useEffect, useMemo } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  //useLocation
} from "react-router-dom";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
const apiFetch = (url, options = {}) => fetch(url, { ...options, credentials: "include" });

const fileUrl = (path) => (path ? `${API_BASE}/${path}` : "");

const EventPage = ({
  title,
  events,
  user,
  onRegisterClick
}) => {
  const filtered = events.filter((e) => e.type === title);
  const canRegister = user?.role === "student" && ["Tech Fest", "Workshops", "Sports"].includes(title);

  return (
    <div className="page">
      <h2>{title}</h2>

      {filtered.length === 0 ? (
        <p>No events available</p>
      ) : (
        <div className="event-page-grid">
          {filtered.map((e) => (
            <div key={e.id || `${e.type}-${e.name}-${e.date}`} className="event-box">
              <div className="event-box-header">
                <h4>{e.name}</h4>
                <span className="event-chip">{e.type}</span>
              </div>

              {e.info && <p><strong>Information:</strong> {e.info}</p>}
              {e.date && <p><strong>Date:</strong> {e.date}</p>}
              {e.venue && <p><strong>Venue:</strong> {e.venue}</p>}
              {e.duration && <p><strong>Duration:</strong> {e.duration}</p>}
              {e.time && <p><strong>Time:</strong> {e.time}</p>}
              {e.fee && <p><strong>Fee:</strong> {e.fee}</p>}
              {e.last_date && <p><strong>Last Date:</strong> {e.last_date}</p>}
              {e.mode && <p><strong>Mode:</strong> {e.mode}</p>}
              {e.amount && <p><strong>Amount:</strong> {e.amount}</p>}
              {e.eligibility && <p><strong>Eligibility:</strong> {e.eligibility}</p>}
              {e.registration_link && (
                <a
                  href={e.registration_link}
                  target="_blank"
                  rel="noreferrer"
                  className="register-link-btn"
                >
                  Apply / Register Now
                </a>
              )}

              <div className="event-actions">
                {e.file_path && (
                  <a
                    href={fileUrl(e.file_path)}
                    target="_blank"
                    rel="noreferrer"
                    className="action-btn secondary-btn"
                  >
                    View PDF
                  </a>
                )}

                {canRegister && (
                  <button
                    className="action-btn primary-btn"
                    onClick={() => onRegisterClick(e)}
                  >
                    Register
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Link to="/" className="back-btn">
        ⬅ Back
      </Link>
    </div>
  );
};


// Student Login component
// Handles student authentication and login form data
const StudentLogin = ({ setLoggedIn, setUser, closeLogin }) => {

  // Hook used to navigate to different pages after login
  const navigate = useNavigate();

  // Reference used to access the popup/login container DOM element
  const popupRef = useRef(null);

  // Stores the student's email address
  const [email, setEmail] = useState("");

  // Stores the student's password
  const [password, setPassword] = useState("");

  // Stores the student's branch
  const [branch, setBranch] = useState("");

  // Stores the student's PIN number
  const [pinNumber, setPinNumber] = useState("");

  // Controls the loading state while login is being processed
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        closeLogin();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [closeLogin]);

  const handleStudentLogin = async () => {
    try {
      setLoading(true);

      const res = await apiFetch(`${API_BASE}/api/student/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
          branch,
          pinNumber
        })
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      setLoggedIn(true);
      setUser(data.user);
      closeLogin();
      navigate("/");
    } catch (err) {
      alert("Server error ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <div className="popup glass-popup" ref={popupRef}>
        <h3>Student Login</h3>

        <input
          className="modern-input"
          placeholder="College Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="modern-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          className="modern-input"
          placeholder="Branch"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
        />

        <input
          className="modern-input"
          placeholder="Pin Number"
          value={pinNumber}
          onChange={(e) => setPinNumber(e.target.value)}
        />

        <button className="modern-btn" onClick={handleStudentLogin} disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
      </div>
    </div>
  );
};


// Admin Login component
// Manages admin login and popup behavior
const AdminLogin = ({ setLoggedIn, setUser, closeLogin }) => {

  // Used for page navigation after successful login
  const navigate = useNavigate();

  // Stores a reference to the login popup
  const loginBoxRef = useRef(null);

  // Admin login form values
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Indicates whether the login process is in progress
  const [loading, setLoading] = useState(false);

  // Detect clicks outside the login popup
  useEffect(() => {

    // Function to handle clicks on the document
    const checkOutsideClick = (event) => {
      const loginBox = loginBoxRef.current;

      // Close the popup if the click occurs outside the login box
      if (loginBox && !loginBox.contains(event.target)) {
        closeLogin();
      }
    };

    // Listen for mouse clicks on the page
    document.addEventListener("mousedown", checkOutsideClick);

    // Remove the event listener when the component is unmounted
    return () => {
      document.removeEventListener("mousedown", checkOutsideClick);
    };
  }, [closeLogin]);

  // Rest of the login functionality remains unchanged...
};


    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [closeLogin]);

  const handleAdminLogin = async () => {
    try {
      setLoading(true);

      const res = await apiFetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      setLoggedIn(true);
      setUser(data.user);
      closeLogin();
      navigate("/admin");
    } catch (err) {
      alert("Server error ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <div className="popup glass-popup" ref={popupRef}>
        <h3>Admin Login</h3>

        <input
          className="modern-input"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="modern-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="modern-btn" onClick={handleAdminLogin} disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
      </div>
    </div>
  );
};

const LoginTypePopup = ({ onClose, onStudent, onAdmin }) => {
  const popupRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [onClose]);

  return (
    <div className="login-overlay">
      <div className="popup glass-popup" ref={popupRef}>
        <h3>Select Login Type</h3>

        <button className="modern-btn" onClick={onStudent}>
          Student Login
        </button>

        <button className="modern-btn" onClick={onAdmin}>
          Admin Login
        </button>
      </div>
    </div>
  );
};

const RegisterPopup = ({
  user,
  selectedEvent,
  closePopup,
  onRegister
}) => {
  const popupRef = useRef(null);
  const [studentName, setStudentName] = useState(user?.name || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        closePopup();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [closePopup]);

  const submit = async () => {
    if (!studentName.trim()) {
      alert("Please enter your name");
      return;
    }

    try {
      setLoading(true);
      await onRegister(studentName);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <div className="popup glass-popup" ref={popupRef}>
        <h3>Register for {selectedEvent?.name}</h3>

        <input
          className="modern-input"
          placeholder="Name"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
        />

        <input
          className="modern-input"
          value={user?.branch || ""}
          placeholder="Branch"
          readOnly
        />

        <input
          className="modern-input"
          value={user?.pinNumber || ""}
          placeholder="Pin Number"
          readOnly
        />

        <button className="modern-btn" onClick={submit} disabled={loading}>
          {loading ? "Registering..." : "Confirm Registration"}
        </button>
      </div>
    </div>
  );
};

const BotMessage = ({ msg }) => {
  return (
    <div className="msg-row bot-row">
      <div className="bot-icon">🤖</div>
      <div className="msg-bubble bot-msg">
        <div>{msg.text}</div>
        {msg.pdfPath && (
          <a
            href={fileUrl(msg.pdfPath)}
            target="_blank"
            rel="noreferrer"
            className="inline-doc-link"
          >
            Open related PDF
          </a>
        )}
      </div>
    </div>
  );
};

function AppContent() {
  //const location=useLocation();
  const navigate = useNavigate();
  const [openChat, setOpenChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const clearChat = () => {
    setMessages([])
  }
  const [input, setInput] = useState("");

  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const [showHistory, setShowHistory] = useState(false);

  const [showLoginTypePopup, setShowLoginTypePopup] = useState(false);
  const [showStudentLoginPopup, setShowStudentLoginPopup] = useState(false);
  const [showAdminLoginPopup, setShowAdminLoginPopup] = useState(false);

  const [showRegisterPopup, setShowRegisterPopup] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [adminSection, setAdminSection] = useState("events");
  const [selectedEventType, setSelectedEventType] = useState("");

  const [eventFields, setEventFields] = useState({
    name: "",
    info: "",
    date: "",
    venue: "",
    duration: "",
    time: "",
    fee: "",
    lastDate: "",
    mode: "",
    amount: "",
    eligibility: "",
    registrationLink: ""
  });

  const [selectedEventFile, setSelectedEventFile] = useState(null);
  const [selectedQaFile, setSelectedQaFile] = useState(null);
  const [selectedNoticeFile, setSelectedNoticeFile] = useState(null);

  const [mainEvents, setMainEvents] = useState([]);
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaAnswer, setQaAnswer] = useState("");
  const [qaList, setQaList] = useState([]);
  const [noticeText, setNoticeText] = useState("");
  const [notices, setNotices] = useState([]);
  const [registrations, setRegistrations] = useState([]);

  const messagesEndRef = useRef(null);
  const chatPanelRef = useRef(null);
  const historyPanelRef = useRef(null);
  const historyToggleRef = useRef(null);

  const isOverlayOpen = useMemo(
    () =>
      showLoginTypePopup ||
      showStudentLoginPopup ||
      showAdminLoginPopup ||
      showRegisterPopup,
    [showLoginTypePopup, showStudentLoginPopup, showAdminLoginPopup, showRegisterPopup]
  );

  const fetchAllData = async () => {
    try {
      const [eventsRes, qaRes, noticesRes, regsRes] = await Promise.all([
        apiFetch(`${API_BASE}/api/events`),
        apiFetch(`${API_BASE}/api/qa`),
        apiFetch(`${API_BASE}/api/notices`),
        apiFetch(`${API_BASE}/api/event-registrations`)
      ]);

      const [eventsData, qaData, noticesData, regsData] = await Promise.all([
        eventsRes.json(),
        qaRes.json(),
        noticesRes.json(),
        regsRes.json()
      ]);

      setMainEvents(Array.isArray(eventsData) ? eventsData : []);
      setQaList(Array.isArray(qaData) ? qaData : []);
      setNotices(Array.isArray(noticesData) ? noticesData : []);
      setRegistrations(Array.isArray(regsData) ? regsData : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    apiFetch(`${API_BASE}/api/auth/me`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.success) {
          setUser(data.user);
          setLoggedIn(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleOutsideChat = (event) => {
      if (
        openChat &&
        chatPanelRef.current &&
        !chatPanelRef.current.contains(event.target)
      ) {
        setOpenChat(false);
        setShowHistory(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideChat);
    return () => document.removeEventListener("mousedown", handleOutsideChat);
  }, [openChat]);

  useEffect(() => {
    const handleOutsideHistory = (event) => {
      if (!showHistory) return;

      const insideHistory =
        historyPanelRef.current && historyPanelRef.current.contains(event.target);

      const clickedToggle =
        historyToggleRef.current && historyToggleRef.current.contains(event.target);

      if (!insideHistory && !clickedToggle) {
        setShowHistory(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideHistory);
    return () => document.removeEventListener("mousedown", handleOutsideHistory);
  }, [showHistory]);

  const handleLogout = async () => {
    try { await apiFetch(`${API_BASE}/api/auth/logout`, { method: "POST" }); } catch {}
    setLoggedIn(false);
    setUser(null);
    setOpenChat(false);
    setShowHistory(false);
    setMessages([]);
    setInput("");
    setAdminSection("events");
    setShowLoginTypePopup(false);
    setShowStudentLoginPopup(false);
    setShowAdminLoginPopup(false);
    setShowRegisterPopup(false);
    setSelectedEvent(null);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const currentInput = input.trim();

    const requestId = `${Date.now()}-${Math.random()}`;
    const userMsg = {
      id: `${requestId}-user`,
      text: currentInput,
      sender: "user"
    };

    setInput("");

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: requestId, sender: "bot", isThinking: true }
    ]);

    try {
      const res = await apiFetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: currentInput
        })
      });

      const data = await res.json();

      setMessages((prev) => {
        const updated = [...prev];
        const thinkingIndex = updated.findIndex((msg) => msg.id === requestId);

        if (thinkingIndex !== -1) {
          updated[thinkingIndex] = {
            id: Date.now() + 2,
            text: data.reply || "Sorry, I could not find relevant information.",
            sender: "bot",
            pdfPath: data.pdfPath || "",
            pdfTitle: data.pdfTitle || ""
          };
        }

        return updated;
      });
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        const thinkingIndex = updated.findIndex((msg) => msg.id === requestId);

        if (thinkingIndex !== -1) {
          updated[thinkingIndex] = {
            id: Date.now() + 3,
            text: "Server error ❌",
            sender: "bot"
          };
        }

        return updated;
      });
    }
  };

  const handleEventFieldChange = (field, value) => {
    setEventFields((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const resetEventFields = () => {
    setEventFields({
      name: "",
      info: "",
      date: "",
      venue: "",
      duration: "",
      time: "",
      fee: "",
      lastDate: "",
      mode: "",
      amount: "",
      eligibility: "",
      registrationLink: ""
    });
    setSelectedEventFile(null);
  };

  const addEvent = async () => {
    if (!selectedEventType) {
      alert("Please select event type");
      return;
    }

    let newEvent = { type: selectedEventType };

    if (selectedEventType === "Tech Fest" || selectedEventType === "Workshops") {
      if (
        !eventFields.name.trim() ||
        !eventFields.info.trim() ||
        !eventFields.date.trim() ||
        !eventFields.venue.trim()
      ) {
        alert("Please fill all fields");
        return;
      }

      newEvent = {
        ...newEvent,
        name: eventFields.name,
        info: eventFields.info,
        date: eventFields.date,
        venue: eventFields.venue,
        registrationLink: eventFields.registrationLink
      };
    }

    if (selectedEventType === "Exams") {
      if (
        !eventFields.name.trim() ||
        !eventFields.duration.trim() ||
        !eventFields.fee.trim() ||
        !eventFields.lastDate.trim()
      ) {
        alert("Please fill all fields");
        return;
      }

      newEvent = {
        ...newEvent,
        name: eventFields.name,
        duration: eventFields.duration,
        fee: eventFields.fee,
        lastDate: eventFields.lastDate
      };
    }

    if (selectedEventType === "Placements") {
      if (!eventFields.info.trim()) {
        alert("Please fill placement information");
        return;
      }

      newEvent = {
        ...newEvent,
        name: "Placement Information",
        info: eventFields.info
      };
    }

    if (selectedEventType === "Sports") {
      if (
        !eventFields.name.trim() ||
        !eventFields.venue.trim() ||
        !eventFields.duration.trim() ||
        !eventFields.time.trim()
      ) {
        alert("Please fill all fields");
        return;
      }

      newEvent = {
        ...newEvent,
        name: eventFields.name,
        venue: eventFields.venue,
        duration: eventFields.duration,
        time: eventFields.time,
        registrationLink: eventFields.registrationLink
      };
    }

    if (selectedEventType === "Scholarship") {
      if (
        !eventFields.name.trim() ||
        !eventFields.eligibility.trim() ||
        !eventFields.amount.trim() ||
        !eventFields.lastDate.trim() ||
        !eventFields.info.trim()
      ) {
        alert("Please fill all fields");
        return;
      }

      newEvent = {
        ...newEvent,
        name: eventFields.name,
        eligibility: eventFields.eligibility,
        amount: eventFields.amount,
        lastDate: eventFields.lastDate,
        info: eventFields.info,
        registrationLink: eventFields.registrationLink
      };
    }

    try {
      const formData = new FormData();

      Object.entries(newEvent).forEach(([key, value]) => {
        formData.append(key, value ?? "");
      });

      formData.append("uploadedBy", user?.id || "");

      if (selectedEventFile) {
        formData.append("file", selectedEventFile);
      }

      const res = await apiFetch(`${API_BASE}/api/events`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      await fetchAllData();
      resetEventFields();
      alert("Event added successfully");
    } catch (err) {
      alert("Server error ❌");
    }
  };

  const deleteEvent = async (id) => {
    try {
      const res = await apiFetch(`${API_BASE}/api/events/${id}`, {
        method: "DELETE"
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      await fetchAllData();
    } catch (err) {
      alert("Server error ❌");
    }
  };

  const addQA = async () => {
    if (!qaQuestion.trim() || !qaAnswer.trim()) {
      alert("Please fill question and answer");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("question", qaQuestion);
      formData.append("answer", qaAnswer);
      formData.append("uploadedBy", user?.id || "");
      if (selectedQaFile) {
        formData.append("file", selectedQaFile);
      }

      const res = await apiFetch(`${API_BASE}/api/qa`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      await fetchAllData();
      setQaQuestion("");
      setQaAnswer("");
      setSelectedQaFile(null);
    } catch (err) {
      alert("Server error ❌");
    }
  };

  const deleteQA = async (id) => {
    try {
      const res = await apiFetch(`${API_BASE}/api/qa/${id}`, {
        method: "DELETE"
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      await fetchAllData();
    } catch (err) {
      alert("Server error ❌");
    }
  };

  const addNotice = async () => {
    if (!noticeText.trim()) {
      alert("Please enter notice information");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("noticeText", noticeText);
      formData.append("uploadedBy", user?.id || "");
      if (selectedNoticeFile) {
        formData.append("file", selectedNoticeFile);
      }

      const res = await apiFetch(`${API_BASE}/api/notices`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      await fetchAllData();
      setNoticeText("");
      setSelectedNoticeFile(null);
    } catch (err) {
      alert("Server error ❌");
    }
  };

  const deleteNotice = async (id) => {
    try {
      const res = await apiFetch(`${API_BASE}/api/notices/${id}`, {
        method: "DELETE"
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      await fetchAllData();
    } catch (err) {
      alert("Server error ❌");
    }
  };

  const handleRegisterClick = (event) => {
    if (!loggedIn || user?.role !== "student") {
      setShowLoginTypePopup(true);
      return;
    }

    setSelectedEvent(event);
    setShowRegisterPopup(true);
  };

  const handleRegisterSubmit = async (studentName) => {
    try {
      const res = await apiFetch(`${API_BASE}/api/register-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          studentName
        })
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      alert("Registered successfully ✅");
      setShowRegisterPopup(false);
      setSelectedEvent(null);
      await fetchAllData();
    } catch (err) {
      alert("Server error ❌");
    }
  };

  const filteredAdminEvents = mainEvents.filter(
    (e) => e.type === selectedEventType
  );

  const questionHistory = messages.filter(
    (msg) => msg.sender === "user" && !msg.isThinking
  );

  const techWorkshopSportsRegistrations = registrations.filter((r) =>
    ["Tech Fest", "Workshops", "Sports"].includes(r.event_type)
  );

  return (
    <>
      <div className={isOverlayOpen ? "blur" : ""}>
        <div className="header">
          <div className="header-shell">
            <div>
              <h1>Student Helpdesk</h1>
              <p>Mahatma Gandhi Institute of Technology</p>
            </div>

            {user && (
              <div className="header-user-card">
                <span className="header-user-role">{user.role}</span>
                <span className="header-user-email">{user.email}</span>
              </div>
            )}
          </div>
        </div>

        <div className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  {!loggedIn && (
                    <div className="login-msg">
                      Login with College Email ID
                      <span onClick={() => setShowLoginTypePopup(true)}> Click Here</span>
                    </div>
                  )}

                  <h3 className="events-title">Events</h3>

                  <div className="events-section">
                    <Link to="/Tech Fest" className="event-card">Tech Fest</Link>
                    <Link to="/Exams" className="event-card">Exams</Link>
                    <Link to="/Workshops" className="event-card">Workshops</Link>
                    <Link to="/Placements" className="event-card">Placements</Link>
                    <Link to="/Sports" className="event-card">Sports</Link>
                    <Link to="/Scholarship" className="event-card">Scholarships</Link>
                  </div>

                  <div className="notice glass-block">
                    <div className="section-head">
                      <h3>Notice Board</h3>
                      <span className="section-subtitle">Latest updates and documents</span>
                    </div>

                    {notices.length === 0 ? (
                      <p>All updates will be shown here.</p>
                    ) : (
                      <div className="notice-list">
                        {notices.map((notice) => (
                          <div key={notice.id} className="notice-item">
                            <p>{notice.notice_text}</p>
                            {notice.file_path && (
                              <a
                                href={fileUrl(notice.file_path)}
                                target="_blank"
                                rel="noreferrer"
                                className="tiny-link"
                              >
                                View PDF
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </>
              }
            />

            <Route
              path="/Tech Fest"
              element={
                <EventPage
                  title="Tech Fest"
                  events={mainEvents}
                  user={user}
                  onRegisterClick={handleRegisterClick}
                />
              }
            />
            <Route
              path="/Exams"
              element={
                <EventPage
                  title="Exams"
                  events={mainEvents}
                  user={user}
                  onRegisterClick={handleRegisterClick}
                />
              }
            />
            <Route
              path="/Workshops"
              element={
                <EventPage
                  title="Workshops"
                  events={mainEvents}
                  user={user}
                  onRegisterClick={handleRegisterClick}
                />
              }
            />
            <Route
              path="/Placements"
              element={
                <EventPage
                  title="Placements"
                  events={mainEvents}
                  user={user}
                  onRegisterClick={handleRegisterClick}
                />
              }
            />
            <Route
              path="/Sports"
              element={
                <EventPage
                  title="Sports"
                  events={mainEvents}
                  user={user}
                  onRegisterClick={handleRegisterClick}
                />
              }
            />
            <Route
              path="/Scholarship"
              element={
                <EventPage
                  title="Scholarship"
                  events={mainEvents}
                  user={user}
                  onRegisterClick={handleRegisterClick}
                />
              }
            />

            <Route
              path="/admin"
              element={
                loggedIn && user?.role === "admin" ? (
                  <div className="admin-page">
                    <h2>Admin Dashboard</h2>

                    <div className="admin-top-tabs">
                      <button
                        className={`admin-tab-btn ${adminSection === "qa" ? "active-tab" : ""}`}
                        onClick={() => setAdminSection("qa")}
                      >
                        Q&A
                      </button>

                      <button
                        className={`admin-tab-btn ${adminSection === "events" ? "active-tab" : ""}`}
                        onClick={() => setAdminSection("events")}
                      >
                        Events
                      </button>

                      <button
                        className={`admin-tab-btn ${adminSection === "notice" ? "active-tab" : ""}`}
                        onClick={() => setAdminSection("notice")}
                      >
                        Notice
                      </button>
                    </div>

                    {adminSection === "events" && (
                      <>
                        <select
                          className="modern-input admin-select"
                          value={selectedEventType}
                          onChange={(e) => {
                            setSelectedEventType(e.target.value);
                            resetEventFields();
                          }}
                        >
                          <option value="">Select Event Type</option>
                          <option value="Tech Fest">Tech Fest</option>
                          <option value="Exams">Exams</option>
                          <option value="Workshops">Workshops</option>
                          <option value="Placements">Placements</option>
                          <option value="Sports">Sports</option>
                          <option value="Scholarship">Scholarships</option>
                        </select>

                        {selectedEventType && (
                          <div className="admin-form-grid">
                            {(selectedEventType === "Tech Fest" || selectedEventType === "Workshops") && (
                              <>
                                <input
                                  className="modern-input"
                                  placeholder={selectedEventType === "Tech Fest" ? "Event Name" : "Workshop Name"}
                                  value={eventFields.name}
                                  onChange={(e) => handleEventFieldChange("name", e.target.value)}
                                />
                                <textarea
                                  className="modern-textarea"
                                  placeholder="Detailed Information"
                                  value={eventFields.info}
                                  onChange={(e) => handleEventFieldChange("info", e.target.value)}
                                />
                                <input
                                  className="modern-input"
                                  placeholder="Date"
                                  value={eventFields.date}
                                  onChange={(e) => handleEventFieldChange("date", e.target.value)}
                                />
                                <input
                                  className="modern-input"
                                  placeholder="Venue"
                                  value={eventFields.venue}
                                  onChange={(e) => handleEventFieldChange("venue", e.target.value)}
                                />
                                <input
                                  type="text"
                                  className="modern-input"
                                  placeholder="Registration / Apply Link"
                                  value={eventFields.registrationLink}
                                  onChange={(e) =>
                                    setEventFields({ ...eventFields, registrationLink: e.target.value })
                                  }
                                />
                              </>
                            )}

                            {selectedEventType === "Exams" && (
                              <>
                                <input
                                  className="modern-input"
                                  placeholder="Exam Name / Subject"
                                  value={eventFields.name}
                                  onChange={(e) => handleEventFieldChange("name", e.target.value)}
                                />
                                <input
                                  className="modern-input"
                                  placeholder="Exam Duration"
                                  value={eventFields.duration}
                                  onChange={(e) => handleEventFieldChange("duration", e.target.value)}
                                />
                                <input
                                  className="modern-input"
                                  placeholder="Exam Fee Payment"
                                  value={eventFields.fee}
                                  onChange={(e) => handleEventFieldChange("fee", e.target.value)}
                                />
                                <input
                                  className="modern-input"
                                  placeholder="Last Date for Fee Payment"
                                  value={eventFields.lastDate}
                                  onChange={(e) => handleEventFieldChange("lastDate", e.target.value)}
                                />
                              </>
                            )}

                            {selectedEventType === "Placements" && (
                              <textarea
                                className="modern-textarea full-width-textarea"
                                placeholder="Placement Related Information"
                                value={eventFields.info}
                                onChange={(e) => handleEventFieldChange("info", e.target.value)}
                              />
                            )}

                            {selectedEventType === "Sports" && (
                              <>
                                <input
                                  className="modern-input"
                                  placeholder="Sport Name"
                                  value={eventFields.name}
                                  onChange={(e) => handleEventFieldChange("name", e.target.value)}
                                />
                                <input
                                  className="modern-input"
                                  placeholder="Sport Venue"
                                  value={eventFields.venue}
                                  onChange={(e) => handleEventFieldChange("venue", e.target.value)}
                                />
                                <input
                                  className="modern-input"
                                  placeholder="Sport Duration"
                                  value={eventFields.duration}
                                  onChange={(e) => handleEventFieldChange("duration", e.target.value)}
                                />
                                <input
                                  className="modern-input"
                                  placeholder="Sport Time"
                                  value={eventFields.time}
                                  onChange={(e) => handleEventFieldChange("time", e.target.value)}
                                />
                                <input
                                  type="text"
                                  className="modern-input"
                                  placeholder="Registration / Apply Link"
                                  value={eventFields.registrationLink}
                                  onChange={(e) =>
                                    setEventFields({ ...eventFields, registrationLink: e.target.value })
                                  }
                                />
                              </>
                            )}

                            {selectedEventType === "Scholarship" && (
                              <>
                                <input
                                  className="modern-input"
                                  placeholder="Scholarship Name"
                                  value={eventFields.name}
                                  onChange={(e) => handleEventFieldChange("name", e.target.value)}
                                />
                                <textarea
                                  className="modern-textarea"
                                  placeholder="Scholarship Information"
                                  value={eventFields.info}
                                  onChange={(e) => handleEventFieldChange("info", e.target.value)}
                                />
                                <input
                                  className="modern-input"
                                  placeholder="Eligibility"
                                  value={eventFields.eligibility}
                                  onChange={(e) => handleEventFieldChange("eligibility", e.target.value)}
                                />
                                <input
                                  className="modern-input"
                                  placeholder="Amount"
                                  value={eventFields.amount}
                                  onChange={(e) => handleEventFieldChange("amount", e.target.value)}
                                />
                                <input
                                  className="modern-input"
                                  placeholder="Last Date"
                                  value={eventFields.lastDate}
                                  onChange={(e) => handleEventFieldChange("lastDate", e.target.value)}
                                />
                                <input
                                  type="text"
                                  className="modern-input"
                                  placeholder="Registration / Apply Link"
                                  value={eventFields.registrationLink}
                                  onChange={(e) =>
                                    setEventFields({ ...eventFields, registrationLink: e.target.value })
                                  }
                                />
                              </>
                            )}



                            <input
                              type="file"
                              className="modern-input"
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => setSelectedEventFile(e.target.files[0] || null)}
                            />

                            <button className="modern-btn" onClick={addEvent}>
                              Add Event
                            </button>
                          </div>
                        )}

                        <h3>Added Events</h3>
                        {filteredAdminEvents.length === 0 ? (
                          <p>No added events</p>
                        ) : (
                          filteredAdminEvents.map((e) => (
                            <div key={e.id} className="event-box admin-added-box">
                              <h4>{e.name}</h4>
                              {e.info && <p><strong>Information:</strong> {e.info}</p>}
                              {e.date && <p><strong>Date:</strong> {e.date}</p>}
                              {e.venue && <p><strong>Venue:</strong> {e.venue}</p>}
                              {e.duration && <p><strong>Duration:</strong> {e.duration}</p>}
                              {e.time && <p><strong>Time:</strong> {e.time}</p>}
                              {e.fee && <p><strong>Fee:</strong> {e.fee}</p>}
                              {e.last_date && <p><strong>Last Date:</strong> {e.last_date}</p>}
                              {e.amount && <p><strong>Amount:</strong> {e.amount}</p>}
                              {e.eligibility && <p><strong>Eligibility:</strong> {e.eligibility}</p>}
                              <div className="event-actions">
                                {e.file_path && (
                                  <a
                                    href={fileUrl(e.file_path)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="action-btn secondary-btn"
                                  >
                                    View PDF
                                  </a>
                                )}
                                <button
                                  className="action-btn danger-btn"
                                  onClick={() => deleteEvent(e.id)}
                                >
                                  Delete Event
                                </button>
                              </div>
                            </div>
                          ))
                        )}

                        <div className="glass-block registrations-panel">
                          <div className="section-head">
                            <h3>Registrations</h3>
                            <span className="section-subtitle">Tech Fest / Workshops / Sports</span>
                          </div>

                          {techWorkshopSportsRegistrations.length === 0 ? (
                            <p>No registrations yet.</p>
                          ) : (
                            <div className="table-wrap">
                              <table className="admin-table">
                                <thead>
                                  <tr>
                                    <th>Student Name</th>
                                    <th>Branch</th>
                                    <th>Pin</th>
                                    <th>Event</th>
                                    <th>Type</th>
                                    <th>Time</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {techWorkshopSportsRegistrations.map((r) => (
                                    <tr key={r.id}>
                                      <td>{r.student_name}</td>
                                      <td>{r.branch}</td>
                                      <td>{r.pin_number}</td>
                                      <td>{r.event_name}</td>
                                      <td>{r.event_type}</td>
                                      <td>{new Date(r.registered_at).toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {adminSection === "qa" && (
                      <div className="admin-qa-section">
                        <textarea
                          className="modern-textarea full-width-textarea"
                          placeholder="Enter Question"
                          value={qaQuestion}
                          onChange={(e) => setQaQuestion(e.target.value)}
                        />
                        <textarea
                          className="modern-textarea full-width-textarea"
                          placeholder="Enter Answer"
                          value={qaAnswer}
                          onChange={(e) => setQaAnswer(e.target.value)}
                        />

                        <input
                          type="file"
                          className="modern-input"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setSelectedQaFile(e.target.files[0] || null)}
                        />

                        <button className="modern-btn" onClick={addQA}>
                          Add Q&A
                        </button>

                        <h3>Saved Q&A</h3>
                        {qaList.length === 0 ? (
                          <p>No Q&A added</p>
                        ) : (
                          qaList.map((item) => (
                            <div key={item.id} className="event-box admin-added-box">
                              <p><strong>Question:</strong> {item.question}</p>
                              <p><strong>Answer:</strong> {item.answer}</p>
                              <div className="event-actions">
                                {item.file_path && (
                                  <a
                                    href={fileUrl(item.file_path)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="action-btn secondary-btn"
                                  >
                                    View PDF
                                  </a>
                                )}
                                <button
                                  className="action-btn danger-btn"
                                  onClick={() => deleteQA(item.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {adminSection === "notice" && (
                      <div className="admin-notice-section">
                        <textarea
                          className="modern-textarea full-width-textarea"
                          placeholder="Enter Notice Information"
                          value={noticeText}
                          onChange={(e) => setNoticeText(e.target.value)}
                        />

                        <div className="notice-upload-row">
                          <input
                            type="file"
                            className="modern-input"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setSelectedNoticeFile(e.target.files[0] || null)}
                          />
                        </div>

                        <button className="modern-btn" onClick={addNotice}>
                          Add Notice
                        </button>

                        <h3>Saved Notices</h3>
                        {notices.length === 0 ? (
                          <p>No notices added</p>
                        ) : (
                          notices.map((notice) => (
                            <div key={notice.id} className="event-box admin-added-box">
                              <p>{notice.notice_text}</p>
                              <div className="event-actions">
                                {notice.file_path && (
                                  <a
                                    href={fileUrl(notice.file_path)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="action-btn secondary-btn"
                                  >
                                    View PDF
                                  </a>
                                )}
                                <button
                                  className="action-btn danger-btn"
                                  onClick={() => deleteNotice(notice.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    <Link to="/" className="back-btn">
                      ⬅ Back
                    </Link>
                  </div>
                ) : (
                  <div className="page">
                    <h2>Access Denied ❌</h2>
                    <Link to="/" className="back-btn">
                      ⬅ Back
                    </Link>
                  </div>
                )
              }
            />
          </Routes>
        </div>

        {!openChat && (
          <div
            className="chatbot"
            onClick={() => {
              if (!loggedIn) {
                setShowLoginTypePopup(true);
              } else {
                setOpenChat(true);
              }
            }}
          >
            <div className="chat-text">Any doubts?</div>
            <div className="bot">🤖</div>
          </div>
        )}

        {openChat && (
          <div className="chat-panel" ref={chatPanelRef}>
            <div className="chat-header">
              <span
                ref={historyToggleRef}
                className="history-toggle"
                onClick={() => setShowHistory((prev) => !prev)}
              >
                ☰
              </span>

              <span className="chat-title">Helpdesk Chat</span>

              <div className="chat-actions">
                <button className="clear-btn" onClick={clearChat}>
                  🗑️
                </button>

                <span onClick={() => setOpenChat(false)}>✖</span>
              </div>
            </div>

            {showHistory && (
              <div className="history-panel" ref={historyPanelRef}>
                <h4>History</h4>
                {questionHistory.length === 0 ? (
                  <p>No questions yet</p>
                ) : (
                  questionHistory.map((msg) => <p key={msg.id}>{msg.text}</p>)
                )}
              </div>
            )}

            <div className="chat-messages">
              {/* Empty State Message */}
              {messages.length === 0 && (
                <div className="empty-chat">
                  How can I help you....?
                </div>
              )}
              {messages.map((msg) => {
                if (msg.isThinking) {
                  return (
                    <div key={msg.id} className="msg-row bot-row">
                      <div className="bot-icon">🤖</div>
                      <div className="typing">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  );
                }

                if (msg.sender === "user") {
                  return (
                    <div key={msg.id} className="msg-row user-row">
                      <div className="msg-bubble user-msg">{msg.text}</div>
                      <div className="user-icon">👤</div>
                    </div>
                  );
                }

                return <BotMessage key={msg.id} msg={msg} />;
              })}

              <div ref={messagesEndRef}></div>
            </div>

            <div className="chat-input">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                placeholder="Type your question..."
              />
              <button onClick={sendMessage}>➤</button>
            </div>
          </div>
        )}

        {user && window.location.pathname !== "/admin" && (
          <div className="portal-wrapper">
            {user?.role === "admin" && (
              <button
                className="admin-btn"
                onClick={() => navigate("/admin")}
              >
                Admin Portal
              </button>
            )}

            <button className="logout-btn-new" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
        <div className="footer">
          <h3>Mahatma Gandhi Institute of Technology</h3>
          <p>Gandipet, Hyderabad</p>
          <p>Email: help@mgit.ac.in</p>
          <p>Helpline: 9876543210</p>
        </div>
      </div>

      {showLoginTypePopup && (
        <LoginTypePopup
          onClose={() => setShowLoginTypePopup(false)}
          onStudent={() => {
            setShowLoginTypePopup(false);
            setShowStudentLoginPopup(true);
          }}
          onAdmin={() => {
            setShowLoginTypePopup(false);
            setShowAdminLoginPopup(true);
          }}
        />
      )}

      {showStudentLoginPopup && (
        <StudentLogin
          setLoggedIn={setLoggedIn}
          setUser={setUser}
          closeLogin={() => setShowStudentLoginPopup(false)}
        />
      )}

      {showAdminLoginPopup && (
        <AdminLogin
          setLoggedIn={setLoggedIn}
          setUser={setUser}
          closeLogin={() => setShowAdminLoginPopup(false)}
        />
      )}

      {showRegisterPopup && selectedEvent && (
        <RegisterPopup
          user={user}
          selectedEvent={selectedEvent}
          closePopup={() => {
            setShowRegisterPopup(false);
            setSelectedEvent(null);
          }}
          onRegister={handleRegisterSubmit}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </Router>
  );
}
