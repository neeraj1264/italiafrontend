import React, { useState, useEffect, useMemo } from "react";
import { FaFileInvoice, FaImage, FaTrash } from "react-icons/fa6";
import { useLocation, useNavigate } from "react-router-dom";
import "./Invoice.css";
import {
  FaMinusCircle,
  FaPlusCircle,
  FaArrowRight,
  FaBars,
  FaTimesCircle,
  FaSearch,
  FaEdit,
  FaShoppingCart,
} from "react-icons/fa";
// import { AiOutlineBars } from "react-icons/ai";
import { IoMdCloseCircle } from "react-icons/io";
import Header from "../header/Header";
import { fetchProducts, removeProduct } from "../../api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { IoClose } from "react-icons/io5";
import { getAll, saveItems } from "../../DB";
import Rawbt3Inch from "../Utils/Rawbt3Inch";

const toastOptions = {
  position: "bottom-right",
  autoClose: 2000,
  pauseOnHover: true,
  draggable: true,
  theme: "dark",
  width: "90%",
};
const Invoice = () => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productsToSend, setProductsToSend] = useState([]);
  const [Search, setSearch] = useState(""); // State for search query
  const [showPopup, setShowPopup] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [selectedVariety, setSelectedVariety] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCategoryVisible, setIsCategoryVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");
  const [includeGST, setIncludeGST] = useState(true);

  const [isChecking, setIsChecking] = useState(false);

  // default to “delivery”
  const [orderType, setOrderType] = useState("delivery");

  // two separate lists in localStorage
  const [deliveryBills, setDeliveryBills] = useState(
    () => JSON.parse(localStorage.getItem("deliveryKotData")) || []
  );
  const [dineInBills, setDineInBills] = useState(
    () => JSON.parse(localStorage.getItem("dineInKotData")) || []
  );

  // tracks which list to show in the modal
  const [modalType, setModalType] = useState("delivery"); // "delivery" or "dine-in"

  const openBillsModal = (type) => {
    setModalType(type);
    setShowKotModal(true);
  };

  // State for modal visibility and data
  const [showKotModal, setShowKotModal] = useState(false);
  const [now, setNow] = useState(Date.now());

  const navigate = useNavigate(); // For navigation

  // Update `now` every second for countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Format milliseconds to HH:mm:ss
  const formatRemaining = (ms) => {
    if (ms <= 0) return "00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      "0"
    );
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const [showRemoveBtn, setShowRemoveBtn] = useState(false);
  let pressTimer;

  const handlePressStart = () => {
    // Set a timeout to show the remove button after 1 second (1000 ms)
    pressTimer = setTimeout(() => {
      setShowRemoveBtn(true);
    }, 1000);
  };

  const handlePressEnd = () => {
    // Clear the timeout if the user releases the press before 1 second
    clearTimeout(pressTimer);
  };

  const filteredProducts = selectedProducts
    .filter((product) =>
      product.name.toLowerCase().includes(Search.toLowerCase())
    )
    .reduce((acc, product) => {
      const category = product.category || "Others";

      // Ensure the category key exists in the accumulator
      if (!acc[category]) {
        acc[category] = [];
      }

      // Add the product to the correct category group
      acc[category].push(product);

      return acc;
    }, {});

  const location = useLocation();

  // memoize sorted category list for consistency
  const categories = useMemo(
    () => Object.keys(filteredProducts).sort((a, b) => a.localeCompare(b)),
    [filteredProducts]
  );

  // initialize activeCategory when filteredProducts first load
  useEffect(() => {
    if (categories.length) setActiveCategory(categories[0]);
  }, [categories]);

  // improved scroll‐spy
  useEffect(() => {
    const offset = 7 * 24; // px

    const onScroll = () => {
      // build array of {cat, distance} pairs
      const distances = categories.map((cat) => {
        const el = document.getElementById(cat);
        const top = el ? el.getBoundingClientRect().top : Infinity;
        return { cat, distance: top - offset };
      });

      // filter for those “above” the offset, then pick the one closest to it
      const inView = distances
        .filter((d) => d.distance <= 0)
        .sort((a, b) => b.distance - a.distance);

      setActiveCategory(inView[0]?.cat ?? categories[0]);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // run once on mount
    return () => window.removeEventListener("scroll", onScroll);
  }, [categories]);

  useEffect(() => {
    const fromCustomerDetail = location.state?.from === "customer-detail";
    if (fromCustomerDetail) {
      localStorage.removeItem("productsToSend");
      setProductsToSend([]);
    }
  }, [location]);

  // Load products from localStorage on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const products = await fetchProducts(); // Use the function from api.js
        setSelectedProducts(products);
        await saveItems("products", products);
        setLoading(false);
      } catch (err) {
        console.warn("Fetch failed, loading from IDB:", err);
        const prods = await getAll("products");
        setSelectedProducts(prods);
        setLoading(false);
      }
    };

    fetchData();

    const storedProductsToSend =
      JSON.parse(localStorage.getItem("productsToSend")) || [];
    setProductsToSend(storedProductsToSend);

    localStorage.removeItem("deliveryCharge");

    // setSelectedVariety([]);
  }, []);

  // Persist cart to IDB whenever it changes
  useEffect(() => {
    // clear old cart, then repopulate
    const syncCart = async () => {
      await saveItems(
        "cart",
        productsToSend.map((p, idx) => ({ ...p, id: idx }))
      );
    };
    if (productsToSend.length) syncCart();
  }, [productsToSend]);

  const handleOpenPopup = (product) => {
    if (product.varieties && product.varieties.length > 0) {
      setCurrentProduct(product);
      setShowPopup(true);

      const savedSelectedVarieties = JSON.parse(
        localStorage.getItem("selectedVariety") || "[]"
      );
      setSelectedVariety(
        savedSelectedVarieties.filter((v) => v.productId === product.id)
      ); // Filter by productId
    } else {
      handleAddToWhatsApp(product); // Directly add product if no varieties
    }
  };
  const handleProductClick = (product) => {
    const audio = new Audio("/sounds/click.wav"); // path from public folder
    audio.play();
    handleOpenPopup(product);
  };

  // useEffect(() => {
  //   // Reset selectedVariety on popup close or when a new product is selected
  //   setSelectedVariety([]);
  // }, [showPopup]);

  // Save selectedVariety to localStorage whenever it changes
  useEffect(() => {
    if (selectedVariety.length > 0) {
      localStorage.setItem("selectedVariety", JSON.stringify(selectedVariety));
    }
  }, [selectedVariety]);

  // Clear selectedVariety from localStorage when page refreshes
  useEffect(() => {
    localStorage.removeItem("selectedVariety");
  }, []);

  const handleVarietyQuantityChange = (variety, delta, productId) => {
    setSelectedVariety((prev) => {
      let updatedVarieties = prev.map((selected) =>
        selected.size === variety.size &&
        selected.price === variety.price &&
        selected.productId === productId
          ? { ...selected, quantity: (selected.quantity || 0) + delta }
          : selected
      );

      // Remove variety if the quantity becomes less than 1
      updatedVarieties = updatedVarieties.filter(
        (selected) => selected.quantity > 0
      );

      // Save updated selectedVariety to localStorage
      localStorage.setItem("selectedVariety", JSON.stringify(updatedVarieties));

      // Update productsToSend based on the updated selectedVarieties

      return updatedVarieties;
    });
  };

  const handleVarietyChange = (variety, isChecked, productId) => {
    setSelectedVariety((prev) => {
      let updatedVarieties;
      if (isChecked) {
        updatedVarieties = [
          ...prev,
          { ...variety, quantity: 1, productId }, // Add productId to variety
        ];
      } else {
        updatedVarieties = prev.filter(
          (selected) =>
            !(
              selected.size === variety.size &&
              selected.price === variety.price &&
              selected.productId === productId
            ) // Match by productId too
        );
      }

      localStorage.setItem("selectedVariety", JSON.stringify(updatedVarieties));
      return updatedVarieties;
    });
  };

  const handleAddToWhatsApp = (product, selectedVarieties = []) => {
    // Handle products with no varieties
    if (selectedVarieties.length === 0) {
      const exists = productsToSend.some(
        (prod) =>
          prod.name === product.name &&
          prod.price === product.price &&
          prod.size === product.size
      );

      if (!exists) {
        // Add the product if it doesn't already exist
        setProductsToSend((prev) => {
          const updatedProducts = [...prev, { ...product, quantity: 1 }];
          // Update localStorage after setting the state
          localStorage.setItem(
            "productsToSend",
            JSON.stringify(updatedProducts)
          );
          return updatedProducts;
        });
      } else {
        // Update quantity if the product already exists
        setProductsToSend((prev) => {
          const updatedProducts = prev.map((prod) =>
            prod.name === product.name &&
            prod.price === product.price &&
            prod.size === product.size
              ? { ...prod, quantity: prod.quantity + 1 }
              : prod
          );
          // Update localStorage after setting the state
          localStorage.setItem(
            "productsToSend",
            JSON.stringify(updatedProducts)
          );
          return updatedProducts;
        });
      }
      return;
    }

    // Handle products with selected varieties
    const newProducts = selectedVarieties.map((variety) => ({
      ...product,
      ...variety,
      quantity: variety.quantity || 0, // Default quantity for each variety
    }));

    setProductsToSend((prev) => {
      let updatedProductsToSend = [...prev];

      newProducts.forEach((newProduct) => {
        const exists = updatedProductsToSend.some(
          (prod) =>
            prod.name === newProduct.name &&
            prod.price === newProduct.price &&
            prod.size === newProduct.size
        );

        if (!exists) {
          updatedProductsToSend.push(newProduct);
        } else {
          updatedProductsToSend = updatedProductsToSend.map((prod) =>
            prod.name === newProduct.name &&
            prod.price === newProduct.price &&
            prod.size === newProduct.size
              ? { ...prod, quantity: newProduct.quantity }
              : prod
          );
        }
      });

      // Update localStorage after state update
      localStorage.setItem(
        "productsToSend",
        JSON.stringify(updatedProductsToSend)
      );

      return updatedProductsToSend;
    });

    setShowPopup(false); // Close popup
    setSelectedVariety([]); // Reset selected varieties
  };

  // Function to handle quantity changes
  const handleQuantityChange = (productName, productPrice, delta) => {
    const updatedProductsToSend = productsToSend
      .map((prod) => {
        if (prod.name === productName && prod.price === productPrice) {
          const newQuantity = prod.quantity + delta;
          if (newQuantity < 1) {
            return null; // Remove the product if quantity goes below 1
          }
          return { ...prod, quantity: newQuantity };
        }
        return prod;
      })
      .filter(Boolean); // Remove any null values

    setProductsToSend(updatedProductsToSend);
    localStorage.setItem(
      "productsToSend",
      JSON.stringify(updatedProductsToSend)
    );
  };

  // Function to remove a product from selected products and productsToSend
  const handleRemoveProduct = async (productName, productPrice) => {
    try {
      // Call the API function
      await removeProduct(productName, productPrice);

      // Remove product from the selectedProducts and productsToSend arrays
      const updatedSelectedProducts = selectedProducts.filter(
        (prod) => !(prod.name === productName && prod.price === productPrice)
      );
      const updatedProductsToSend = productsToSend.filter(
        (prod) => !(prod.name === productName && prod.price === productPrice)
      );

      // Update the state
      setSelectedProducts(updatedSelectedProducts);
      setProductsToSend(updatedProductsToSend);

      // Update localStorage
      localStorage.setItem("products", JSON.stringify(updatedSelectedProducts));
      localStorage.setItem(
        "productsToSend",
        JSON.stringify(updatedProductsToSend)
      );

      console.log("Product removed successfully from both MongoDB and state");
    } catch (error) {
      console.error("Error removing product:", error.message);
    }
  };

  // Helper function to calculate total price
  const calculateTotalPrice = (products = []) => {
    return products.reduce(
      (total, product) => total + product.price * product.quantity,
      0
    );
  };

  const handleCategoryClick = (category) => {
    setIsCategoryVisible((prev) => !prev);
    const categoryElement = document.getElementById(category);
    if (categoryElement) {
      // Calculate the offset position (7rem margin)
      const offset = 7 * 16; // Convert rem to pixels (assuming 1rem = 16px)
      const elementPosition = categoryElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      // Smooth scroll to the position with the offset
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }

    setActiveCategory(category);
  };

  const toggleCategoryVisibility = () => {
    setIsCategoryVisible((prev) => !prev); // Toggle visibility
  };

  // New: KOT (Kitchen Order Ticket) print handler
  const handleKot = () => {
    // Append current order snapshot
    const kotEntry = {
      timestamp: Date.now(),
      date: new Date().toLocaleString(),
      items: productsToSend,
      orderType,
    };

    if (orderType === "delivery") {
      const next = [...deliveryBills, kotEntry];
      setDeliveryBills(next);
      localStorage.setItem("deliveryKotData", JSON.stringify(next));
    } else {
      const next = [...dineInBills, kotEntry];
      setDineInBills(next);
      localStorage.setItem("dineInKotData", JSON.stringify(next));
    }

    // Clear current productsToSend
    setProductsToSend([]);
    localStorage.setItem("productsToSend", JSON.stringify([]));

    const printArea = document.getElementById("sample-section");
    if (!printArea) {
      console.warn("No sample-section found to print.");
      return;
    }

    const header = `
  <div style="text-align:center; font-weight:700; margin-bottom:8px;">
    ${orderType === "delivery" ? "Delivery" : "Dine-In"}
  </div>
`;

    const printContent = header + printArea.innerHTML;
    const win = window.open("", "", "width=600,height=400");
    const style = `<style>
  @page { size: 48mm auto; margin:0; }
  @media print {
    body{ width:48mm; margin:0; padding:4mm; font-size:1rem; }
    .product-item{ display:flex; justify-content:space-between; margin-bottom:1rem;}
    .hr{ border:none; border-bottom:1px solid #000; margin:2px 0;}
    .invoice-btn{ display:none; }
  }
</style>`;

    win.document.write(
      `<html>
      <head>
      <title>KOT Ticket</title>
     ${style}
        </head>
        <body>
        ${printContent}
        </body>
        </html>`
    );
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  // define whatever cats you really want up top:
  const priority = [
    "Pizza",
    "Family pizza",
    "Indian twist pizza",
    "Mini pizza",
    "World wide pizza",
    "Combo pizza",
    "Extra",
    
  ];

  // grab all your raw keys:
  const rawCats = Object.keys(filteredProducts);

  // split them into two groups:
  const topCats = priority.filter((cat) => rawCats.includes(cat));
  const otherCats = rawCats
    .filter((cat) => !priority.includes(cat))
    .sort((a, b) => a.localeCompare(b));

  // final array drives **everything**:
  const categoriess = [...topCats, ...otherCats];

  return (
    <div>
      <ToastContainer />
      <Header
        headerName="Urban Pizzeria"
        setSearch={setSearch}
        onClick={toggleCategoryVisibility}
      />
      <div className="invoice-container">
        {isCategoryVisible && (
          <div className="category-barr">
            <div className="category-b">
              <div className="category-bar">
                {categoriess.map((cat) => (
                  <button
                    key={cat}
                    className={`category-btn ${
                      activeCategory === cat ? "active" : ""
                    }`}
                    onClick={() => handleCategoryClick(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="main-section">
          <div className="main">
            {loading ? (
              // Display loading effect when fetching data
              <div className="lds-ripple">
                <div></div>
                <div></div>
              </div>
            ) : categoriess.length > 0 ? (
              categoriess.map((category) => (
                  <div key={category} className="category-block">
                    <h2 className="category" id={category}>
                      {category}
                    </h2>

                    <div key={category} className="category-container">
                      {filteredProducts[category]
                        .sort((a, b) => a.price - b.price) // Sort products by price in ascending order
                        .map((product, idx) => {
                          const effectivePrice = product.price
                            ? product.price
                            : product.varieties.length > 0
                            ? product.varieties[0].price
                            : 0;

                          const quantity =
                            productsToSend.find(
                              (prod) =>
                                prod.name === product.name &&
                                prod.price === effectivePrice
                            )?.quantity || 0;
                          return (
                            <div
                              key={idx}
                              className={`main-box ${
                                quantity > 0 ? "highlighted" : ""
                              }`}
                              onClick={() => handleProductClick(product)}
                            >
                              <div className="sub-box">
                                <h4 className="p-name">
                                  {product.name}
                                  {product.varieties &&
                                  Array.isArray(product.varieties) &&
                                  product.varieties[0]?.size
                                    ? ` (${product.varieties[0].size})`
                                    : ""}
                                </h4>
                                <p className="p-name-price">
                                  Rs. {effectivePrice.toFixed(2)}
                                </p>
                                {(productsToSend.find(
                                  (prod) =>
                                    prod.name === product.name &&
                                    prod.price === effectivePrice
                                )?.quantity || 0) > 0 && (
                                  <span className="quantity-badge">
                                    <span>
                                      <FaShoppingCart />
                                      {
                                        productsToSend.find(
                                          (prod) =>
                                            prod.name === product.name &&
                                            prod.price === effectivePrice
                                        )?.quantity
                                      }
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))
            ) : (
              <div className="no-data">No data available</div>
            )}
          </div>
        </div>

        {productsToSend.length > 0 && (
          <div className="sample-section">
            <div className="check-container">
              <>
                <ul className="product-list" id="sample-section">
                  <hr className="hr" />
                  <li className="product-item" style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ width: "10%" }}>
                      <span>No.</span>
                    </div>
                    <div style={{ width: "50%", textAlign: "left" }}>
                      <span>Name</span>
                    </div>
                    <div style={{ width: "25%", textAlign: "center" }}>
                      <span>Qty</span>
                    </div>
                    <div style={{ width: "15%", textAlign: "right" }}>
                      <span>Price</span>
                    </div>
                  </li>
                  {/* <div style={{ textAlign: "center" }}>{dash}</div> */}
                  <hr className="hr" />
                  {productsToSend.map((product, index) => (
                    <li
                      key={index}
                      className="product-item"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      <div style={{ width: "10%" }}>
                        <span>{index + 1}.</span>
                      </div>
                      <div style={{ width: "50%" }}>
                        <span>{product.name}</span>
                      </div>
                      <div className="quantity-btns">
                        <button
                          className="icons"
                          onClick={() =>
                            handleQuantityChange(
                              product.name,
                              product.price,
                              -1
                            )
                          }
                        >
                          <FaMinusCircle />
                        </button>
                        <span style={{ margin: "0 .4rem" }}>
                          {productsToSend.find(
                            (prod) =>
                              prod.name === product.name &&
                              prod.price === product.price
                          )?.quantity || 1}
                        </span>
                        <button
                          className="icons"
                          onClick={() =>
                            handleQuantityChange(product.name, product.price, 1)
                          }
                        >
                          <FaPlusCircle />
                        </button>
                      </div>
                      <div style={{ width: "15%", textAlign: "right" }}>
                        <span>{product.price * product.quantity}</span>
                      </div>
                    </li>
                  ))}
                  {/* <div style={{ textAlign: "center" }}>{dash}</div> */}
                  <hr className="hr" />
                  <li className="product-item" style={{ display: "flex" }}>
                    <div
                      style={{
                        width: "77%",
                        textAlign: "center",
                        fontWeight: 800,
                      }}
                    >
                      <span>Total</span>
                    </div>
                    <div
                      style={{
                        width: "23%",
                        textAlign: "right",
                        fontWeight: 900,
                      }}
                    >
                      <span>{calculateTotalPrice(productsToSend)}</span>
                    </div>
                    <div
                      style={{
                        textAlign: "left",
                        fontWeight: 900,
                      }}
                    >
                      <span>/-</span>
                    </div>
                  </li>
                  {/* <div style={{ textAlign: "center" }}>{dash}</div> */}
                  <hr className="hr" />
                  <hr className="hr" style={{ marginBottom: "1rem" }} />
                </ul>

                <div className="checkbox-gst-container">
                  <input
                    type="checkbox"
                    checked={includeGST}
                    onChange={(e) => setIncludeGST(e.target.checked)}
                  />
                  <label style={{ marginLeft: ".5rem" }}>
                    Include GST (5%)
                  </label>
                </div>

                <Rawbt3Inch
                  className="kot-btn"
                  productsToSend={productsToSend}
                  includeGST={includeGST}
                />
                {/* <button
                  onClick={handleKot}
                  className="kot-btn"
                  style={{ borderRadius: "0" }}
                >
                  <h2> Print Kot </h2>
                </button> */}
              </>
            </div>
          </div>
        )}
      </div>
      {showPopup && currentProduct && currentProduct.varieties?.length > 0 && (
        <div className="popup-overlay">
          <div className="popup-contentt">
            <FaTimesCircle
              className="close-icon"
              onClick={() => setShowPopup(false)}
            />
            <h3>Select Size for {currentProduct.name}</h3>
            {currentProduct.varieties.map((variety, index) => (
              <div key={index} className="variety-option">
                <label className="variety-label">
                  <input
                    type="checkbox"
                    name="variety"
                    value={index}
                    checked={selectedVariety.some(
                      (v) =>
                        v.size === variety.size &&
                        v.price === variety.price &&
                        v.productId === currentProduct.id
                    )}
                    onChange={(e) =>
                      handleVarietyChange(
                        variety,
                        e.target.checked,
                        currentProduct.id
                      )
                    }
                  />
                  <span>
                    {variety.size.charAt(0).toUpperCase()} ~ ₹ {variety.price}
                  </span>
                </label>

                {selectedVariety.some(
                  (v) => v.size === variety.size && v.price === variety.price
                ) && (
                  <div className="quantity-buttons">
                    <button
                      onClick={() =>
                        handleVarietyQuantityChange(
                          variety,
                          -1,
                          currentProduct.id
                        )
                      }
                      disabled={variety.quantity <= 1}
                    >
                      <FaMinusCircle />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={
                        selectedVariety.find(
                          (v) =>
                            v.size === variety.size && v.price === variety.price
                        )?.quantity || 1
                      }
                      onChange={(e) => {
                        const quantity = parseInt(e.target.value, 10);
                        handleVarietyQuantityChange(
                          variety,
                          quantity - variety.quantity
                        );
                      }}
                    />
                    <button
                      onClick={() =>
                        handleVarietyQuantityChange(
                          variety,
                          1,
                          currentProduct.id
                        )
                      }
                    >
                      <FaPlusCircle />
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={() =>
                handleAddToWhatsApp(currentProduct, selectedVariety)
              }
              disabled={selectedVariety?.length === 0}
              className="save-btn"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoice;
