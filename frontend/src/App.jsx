import { useEffect, useMemo, useState } from "react";
import "./App.css";

const initialAuthForm = {
  name: "",
  email: "",
  password: ""
};

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");

  const [forgotPassword, setForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");

  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [checkoutError, setCheckoutError] = useState("");

  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);

        const response = await fetch("/api/products");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load products");
        }

        setProducts(Array.isArray(data) ? data : data.value || []);
      } catch (error) {
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  const categories = useMemo(() => {
    return ["All", ...new Set(products.map((product) => product.category))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || product.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const updateAuthForm = (event) => {
    setAuthForm({
      ...authForm,
      [event.target.name]: event.target.value
    });
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    setAuthMessage("");
    setAuthError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: authForm.name,
          email: authForm.email,
          password: authForm.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setAuthMessage("Registration successful. You can now sign in.");
      setAuthMode("login");
      setAuthForm({
        ...initialAuthForm,
        email: authForm.email
      });
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    setAuthMessage("");
    setAuthError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      setToken(data.token);
      setUser(data.user);
      setAuthMessage("Signed in successfully.");
      setAuthForm(initialAuthForm);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setAuthMessage("");
    setAuthError("");
    setCheckoutMessage("");
    setCheckoutError("");
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();

    setForgotMessage("");
    setForgotError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: forgotEmail
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password reset request failed");
      }

      setForgotMessage(
        data.message ||
          "If an account exists for this email, password reset instructions have been sent."
      );
    } catch (error) {
      setForgotError(error.message);
    }
  };

  const addToCart = (product) => {
    setCheckoutMessage("");
    setCheckoutError("");

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item._id === product._id
      );

      if (existingItem) {
        return currentCart.map((item) =>
          item._id === product._id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, product.stock)
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1
        }
      ];
    });
  };

  const changeCartQuantity = (productId, quantity) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item._id === productId
            ? {
                ...item,
                quantity: Math.max(
                  1,
                  Math.min(quantity, item.stock)
                )
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item._id !== productId)
    );
  };

  const handleCheckout = async () => {
    setCheckoutMessage("");
    setCheckoutError("");

    if (!user || !token) {
      setAuthMode("login");
      setAuthMessage("Please sign in before checkout.");
      return;
    }

    if (cart.length === 0) {
      setCheckoutError("Your bag is empty.");
      return;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            product: item._id,
            quantity: item.quantity
          }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Checkout failed");
      }

      setCart([]);
      setCheckoutMessage(
        `Order placed successfully. Order total: ₹${data.order.totalAmount}`
      );
    } catch (error) {
      setCheckoutError(error.message);
    }
  };

  return (
    <div className="app-shell">
      <div className="announcement">
        Welcome to SmartShop — thoughtful picks for everyday living
      </div>

      <header className="site-header">
        <a className="brand" href="#home">
          <strong>Smartshop.</strong>
        </a>

        <nav className="nav-links">
          <a href="#home">Home</a>
          <a href="#products">Shop</a>
          <a href="#about">About</a>
        </nav>

        <div className="header-actions">
          {user ? (
            <button className="text-button" onClick={handleLogout}>
              Sign out
            </button>
          ) : (
            <button
              className="text-button"
              onClick={() => {
                setForgotPassword(false);
                setAuthMode("login");
                setAuthMessage("");
                setAuthError("");
              }}
            >
              Sign in
            </button>
          )}

          <a className="bag-link" href="#bag">
            Bag {cartCount}
          </a>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <p className="eyebrow">THE SMART WAY TO SHOP</p>

            <h1>
              Find your next <em>favourite</em> thing.
            </h1>

            <p className="hero-description">
              Discover useful everyday essentials and little upgrades that
              make a difference.
            </p>

            <a className="primary-button" href="#products">
              Explore collection →
            </a>
          </div>
        </section>

        <section className="intro-section">
          <div>
            <p className="eyebrow">A BETTER EVERYDAY STARTS HERE</p>
            <h2>
              SMART <span>FINDS</span>
            </h2>
          </div>

          <div className="intro-symbol">✦</div>

          <div className="intro-copy">
            <h3>Made for your everyday.</h3>
            <p>
              Good things inside
            </p>

            <div className="feature-grid">
              <div>✳ Curated for you</div>
              <div>✦ Carefully selected products</div>
              <div>◈ Simple shopping experience</div>
              <div>♡ Everyday essentials</div>
            </div>
          </div>
        </section>

        <section className="products-section" id="products">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE COLLECTION</p>
              <h2>
                Shop the <em>essentials.</em>
              </h2>
              <p>
                Explore our collection and find something useful.
              </p>
            </div>

            <div className="search-wrap">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products"
              />
            </div>
          </div>

          <div className="category-row">
            {categories.map((item) => (
              <button
                key={item}
                className={category === item ? "category active" : "category"}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {loadingProducts ? (
            <div className="empty-state">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <strong>0 products</strong>
              <p>
                Unable to load products. Please make sure the backend server
                is running.
              </p>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article className="product-card" key={product._id}>
                  <div className="product-image">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                      />
                    ) : (
                      <span>SmartShop</span>
                    )}
                  </div>

                  <div className="product-info">
                    <p className="product-category">
                      {product.category}
                    </p>

                    <h3>{product.name}</h3>

                    <p>{product.description}</p>

                    <div className="product-bottom">
                      <strong>₹{product.price}</strong>

                      <button
                        className="secondary-button"
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                      >
                        {product.stock === 0
                          ? "Out of stock"
                          : "Add to bag"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="bag-section" id="bag">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR BAG</p>
              <h2>
                Ready when <em>you are.</em>
              </h2>
            </div>
          </div>

          {cart.length === 0 ? (
            <div className="empty-state">
              Your bag is empty.
            </div>
          ) : (
            <div className="bag-content">
              <div className="bag-items">
                {cart.map((item) => (
                  <div className="bag-item" key={item._id}>
                    <div>
                      <h3>{item.name}</h3>
                      <p>₹{item.price} each</p>
                    </div>

                    <div className="quantity-control">
                      <button
                        onClick={() =>
                          changeCartQuantity(
                            item._id,
                            item.quantity - 1
                          )
                        }
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        onClick={() =>
                          changeCartQuantity(
                            item._id,
                            item.quantity + 1
                          )
                        }
                      >
                        +
                      </button>
                    </div>

                    <strong>
                      ₹{item.price * item.quantity}
                    </strong>

                    <button
                      className="remove-button"
                      onClick={() => removeFromCart(item._id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="checkout-box">
                <p>Total</p>
                <strong>₹{cartTotal}</strong>

                <button
                  className="primary-button checkout-button"
                  onClick={handleCheckout}
                >
                  Checkout →
                </button>

                {checkoutMessage && (
                  <p className="success-message">
                    {checkoutMessage}
                  </p>
                )}

                {checkoutError && (
                  <p className="error-message">
                    {checkoutError}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="about-section" id="about">
          <p className="eyebrow">A LITTLE ABOUT US</p>

          <h2>
            Less fuss. More <em>good finds.</em>
          </h2>

          <p>
            SmartShop brings your everyday shopping into one simple place.
            Browse, choose, and keep track of your bag with ease.
          </p>
        </section>
      </main>

      {!user && (
        <section className="auth-section">
          <div className="auth-card">
            {!forgotPassword ? (
              <>
                <p className="eyebrow">
                  {authMode === "login" ? "WELCOME BACK" : "JOIN SMARTSHOP"}
                </p>

                <h2>
                  {authMode === "login"
                    ? "Sign in."
                    : "Create your account."}
                </h2>

                {authMode === "login" ? (
                  <form onSubmit={handleLogin}>
                    <input
                      name="email"
                      type="email"
                      value={authForm.email}
                      onChange={updateAuthForm}
                      placeholder="Email address"
                      required
                    />

                    <input
                      name="password"
                      type="password"
                      value={authForm.password}
                      onChange={updateAuthForm}
                      placeholder="Password"
                      required
                    />

                    <button
                      type="button"
                      className="link-button"
                      onClick={() => {
                        setForgotPassword(true);
                        setForgotEmail(authForm.email);
                        setForgotMessage("");
                        setForgotError("");
                        setAuthMessage("");
                        setAuthError("");
                      }}
                    >
                      Forgot password?
                    </button>

                    <button
                      type="submit"
                      className="primary-button full-width"
                    >
                      Sign in
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister}>
                    <input
                      name="name"
                      value={authForm.name}
                      onChange={updateAuthForm}
                      placeholder="Your name"
                      required
                    />

                    <input
                      name="email"
                      type="email"
                      value={authForm.email}
                      onChange={updateAuthForm}
                      placeholder="Email address"
                      required
                    />

                    <input
                      name="password"
                      type="password"
                      value={authForm.password}
                      onChange={updateAuthForm}
                      placeholder="Password"
                      minLength="8"
                      required
                    />

                    <button
                      type="submit"
                      className="primary-button full-width"
                    >
                      Create account
                    </button>
                  </form>
                )}

                <div className="auth-switch">
                  {authMode === "login" ? (
                    <button
                      className="link-button"
                      onClick={() => {
                        setAuthMode("register");
                        setAuthMessage("");
                        setAuthError("");
                      }}
                    >
                      Create an account
                    </button>
                  ) : (
                    <button
                      className="link-button"
                      onClick={() => {
                        setAuthMode("login");
                        setAuthMessage("");
                        setAuthError("");
                      }}
                    >
                      Already have an account? Sign in
                    </button>
                  )}
                </div>

                {authMessage && (
                  <p className="success-message">{authMessage}</p>
                )}

                {authError && (
                  <p className="error-message">{authError}</p>
                )}
              </>
            ) : (
              <>
                <p className="eyebrow">ACCOUNT RECOVERY</p>

                <h2>Reset your password.</h2>

                <p>
                  Enter your account email and we’ll start the password
                  reset process.
                </p>

                <form onSubmit={handleForgotPassword}>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(event) =>
                      setForgotEmail(event.target.value)
                    }
                    placeholder="Email address"
                    required
                  />

                  <button
                    type="submit"
                    className="primary-button full-width"
                  >
                    Send reset instructions
                  </button>
                </form>

                <button
                  className="link-button"
                  onClick={() => {
                    setForgotPassword(false);
                    setForgotMessage("");
                    setForgotError("");
                  }}
                >
                  ← Back to sign in
                </button>

                {forgotMessage && (
                  <p className="success-message">
                    {forgotMessage}
                  </p>
                )}

                {forgotError && (
                  <p className="error-message">
                    {forgotError}
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      )}

      <footer className="site-footer">
        <div>
          <strong>Smartshop.</strong>
          <p>Simple finds for everyday life.</p>
        </div>

        <p>© 2026 SmartShop</p>
      </footer>
    </div>
  );
}

export default App;