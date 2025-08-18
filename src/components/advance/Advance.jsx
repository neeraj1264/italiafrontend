import React, { useState, useEffect } from "react";
import "./Advance.css";
import { useNavigate } from "react-router-dom";
import Header from "../header/Header";
import { toast } from "react-toastify";

const Advance = ({ orders, setOrders }) => {
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [password, setPassword] = useState("");
  const [isAdvancedAccessGranted, setIsAdvancedAccessGranted] = useState(false);
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);
  const [advancedCheckboxState, setAdvancedCheckboxState] = useState(false);
  const [normalCheckboxState, setNormalCheckboxState] = useState(false);
  const navigate = useNavigate();
     // ✅ new state for printerType
  const [printerType, setPrinterType] = useState(
    localStorage.getItem("printerType")
  );
  const HARD_CODED_PASSWORD = "0002"; // Hardcoded password

  useEffect(() => {
    const advancedFeatureAccess = localStorage.getItem("advancedFeature");
    const passwordCorrect = localStorage.getItem("passwordCorrect");

    if (advancedFeatureAccess === "true") {
      setIsAdvancedAccessGranted(true);
      setAdvancedCheckboxState(true);
    }
    if (passwordCorrect === "true") {
      setIsPasswordCorrect(true);
      setNormalCheckboxState(true);
    }
  }, []);

  // Handle Password Submission
  const handlePasswordSubmit = () => {
    if (password === HARD_CODED_PASSWORD) {
      setIsAdvancedAccessGranted(true);
      setIsPasswordCorrect(true);
      setShowPasswordPopup(false);
      setAdvancedCheckboxState(true);
      setNormalCheckboxState(true);
      localStorage.setItem("advancedFeature", "true");
      localStorage.setItem("passwordCorrect", "true");
      toast.info("Access granted!");
    } else {
      toast.error("Incorrect password. Try again.");
    }
  };

  // Handle Advanced Checkbox Click
  const handleAdvancedCheckboxClick = () => {
    if (advancedCheckboxState) {
      // Uncheck logic
      setAdvancedCheckboxState(false);
      setIsAdvancedAccessGranted(false);
      localStorage.removeItem("advancedFeature");
      toast.info("Access removed!");
    } else {
      // Check logic
      setShowPasswordPopup(true); // Show password popup
    }
  };

  // Handle Normal Checkbox Click
  const handleNormalCheckboxClick = () => {
    if (!normalCheckboxState) {
      setShowPasswordPopup(true); // Show password popup
    }
  };

   useEffect(() => {
    localStorage.setItem("printerType", printerType);
  }, [printerType]);

  return (
    <>
      <Header />
      <div className="advance-page">
        {/* Advanced Features Checkbox */}
        <div className="checkbox-container">
          <label>
            <input
              type="checkbox"
              checked={advancedCheckboxState}
              onChange={handleAdvancedCheckboxClick} // Manage state directly here
            />
            <h4>Access Advanced Features</h4>
          </label>
        </div>
        {/* Normal Features Checkbox */}
        <div className="checkbox-container">
          <label>
            <input
              type="checkbox"
              checked={normalCheckboxState}
              onChange={() => {}} // Prevent default behavior
              onClick={handleNormalCheckboxClick} // Show popup if unchecked
            />
            <h4>Employee</h4>
          </label>
        </div>
        <div className="checkbox-container">
          <label>
            <input
              className="PrinterTypeContainer"
              type="radio"
              name="printerType"
              value="rawbt"
              checked={localStorage.getItem("printerType") === "rawbt"}
              onChange={() => {
                 setPrinterType("rawbt");
                toast.info("Switched to RawBT printing");
              }}
            />
            Mobile Printing
          </label>

          <label>
            <input
              className="PrinterTypeContainer"
              type="radio"
              name="printerType"
              value="usb"
              checked={localStorage.getItem("printerType") === "usb"}
              onChange={() => {
                setPrinterType("usb");
                toast.info("Switched to USB printing");
              }}
            />
            USB Printing (PC)
          </label>
        </div>
        {/* Password Popup */}
        {showPasswordPopup && (
          <div className="advance-password-popup">
            <div className="popup-content">
              <h3>Enter Password</h3>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
              <button onClick={handlePasswordSubmit}>Submit</button>
              <button onClick={() => setShowPasswordPopup(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Advance;
