import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = '/api/products'
const AUTH_URL = '/api/auth'

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(price)
}

function App() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cartOpen, setCartOpen] = useState(false)

  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authName, setAuthName] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [token, setToken] = useState('')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(API_URL)

        if (!response.ok) {
          throw new Error('Unable to load products.')
        }

        const data = await response.json()
setProducts(Array.isArray(data) ? data : data.value || [])
      } catch (err) {
        setError(err.message || 'Something went wrong.')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const categories = useMemo(
    () => ['All', ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products],
  )

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        category === 'All' || product.category === category

      const searchText = search.trim().toLowerCase()
      const matchesSearch =
        !searchText ||
        product.name?.toLowerCase().includes(searchText) ||
        product.description?.toLowerCase().includes(searchText)

      return matchesCategory && matchesSearch
    })
  }, [products, category, search])

  const addToCart = (product) => {
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item._id === product._id)

      if (existing) {
        return currentCart.map((item) =>
          item._id === product._id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, product.stock),
              }
            : item,
        )
      }

      return [...currentCart, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId, change) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item._id === productId
            ? {
                ...item,
                quantity: Math.min(
                  Math.max(item.quantity + change, 0),
                  item.stock,
                ),
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  const openAuth = (mode) => {
    setAuthMode(mode)
    setAuthMessage('')
    setAuthError('')
    setAuthPassword('')
    setAuthOpen(true)
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthMessage('')
    setAuthError('')

    if (authMode === 'register' && authPassword.length < 8) {
      setAuthError('Password must contain at least 8 characters.')
      return
    }

    setAuthLoading(true)

    try {
      const endpoint =
        authMode === 'register' ? '/register' : '/login'

      const payload =
        authMode === 'register'
          ? {
              name: authName.trim(),
              email: authEmail.trim(),
              password: authPassword,
            }
          : {
              email: authEmail.trim(),
              password: authPassword,
            }

      const response = await fetch(`${AUTH_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed.')
      }

      if (authMode === 'register') {
        setAuthMessage('Account created successfully. You can now log in.')
        setAuthMode('login')
        setAuthPassword('')
      } else {
        setToken(data.token)
        setUser(data.user)
        setAuthMessage(`Welcome, ${data.user.name}!`)
        setAuthPassword('')
        setAuthName('')
        setAuthEmail('')
        setTimeout(() => setAuthOpen(false), 900)
      }
    } catch (err) {
      setAuthError(err.message || 'Something went wrong.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    setToken('')
    setUser(null)
    setAuthMessage('')
    setAuthError('')
    setCartOpen(false)
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )

  return (
    <div className="shop">
      <div className="announcement">
        Welcome to SmartShop — thoughtful picks for everyday living
      </div>

      <header className="header">
        <a className="brand" href="#" aria-label="SmartShop home">
          <span className="brand-icon">S</span>
          <span>smart<span>shop.</span></span>
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#products">Shop</a>
          <a href="#about">About</a>
        </nav>

        <div className="header-actions">
          {user ? (
            <div className="account-actions">
              <span className="welcome-user">Hi, {user.name}</span>
              <button className="account-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <button
              className="account-button"
              onClick={() => openAuth('login')}
            >
              Sign in
            </button>
          )}

          <button
            className="cart-button"
            onClick={() => setCartOpen(!cartOpen)}
            aria-label={`Open cart with ${cartCount} items`}
          >
            <span>Bag</span>
            <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="eyebrow">THE SMART WAY TO SHOP</span>
            <h1>Find your next <em>favourite</em> thing.</h1>
            <p>
              Discover useful everyday essentials and little upgrades
              that make a difference.
            </p>
            <a href="#products" className="primary-button">
              Explore collection <span>→</span>
            </a>
            <div className="hero-note">
              <span className="hero-dot" />
              A better everyday starts here
            </div>
          </div>

          <div className="hero-art" aria-label="Shopping collection illustration">
            <div className="art-circle circle-one" />
            <div className="art-circle circle-two" />
            <div className="art-card">
              <span className="art-small">SMART FINDS</span>
              <div className="art-product">✦</div>
              <span className="art-caption">Made for your everyday.</span>
            </div>
            <div className="floating-tag tag-one">Good things inside</div>
            <div className="floating-tag tag-two">✳ Curated for you</div>
          </div>
        </section>

        <section className="benefits">
          <div><span>✦</span> Carefully selected products</div>
          <div><span>◈</span> Simple shopping experience</div>
          <div><span>♡</span> Everyday essentials</div>
        </section>

        <section className="products-section" id="products">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE COLLECTION</span>
              <h2>Shop the essentials<span>.</span></h2>
              <p>Explore our collection and find something useful.</p>
            </div>
            <span className="product-count">
              {filteredProducts.length} products
            </span>
          </div>

          <div className="toolbar">
            <div className="search-box">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Search products..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search products"
              />
            </div>

            <div className="category-list" aria-label="Filter by category">
              {categories.map((item) => (
                <button
                  key={item}
                  className={category === item ? 'category active' : 'category'}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {loading && <div className="message">Loading products...</div>}

          {!loading && error && (
            <div className="message error-message">
              {error} Please make sure the backend server is running.
            </div>
          )}

          {!loading && !error && filteredProducts.length === 0 && (
            <div className="message">
              No products found. Try another search or category.
            </div>
          )}

          {!loading && !error && filteredProducts.length > 0 && (
            <div className="product-grid">
              {filteredProducts.map((product, index) => {
                const cartItem = cart.find((item) => item._id === product._id)
                const quantity = cartItem?.quantity || 0

                return (
                  <article className="product-card" key={product._id}>
                    <div className={`product-image image-${index % 4}`}>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} />
                      ) : (
                        <span className="image-placeholder">✦</span>
                      )}
                      <span className="product-category">{product.category}</span>
                    </div>

                    <div className="product-info">
                      <div className="product-title-row">
                        <h3>{product.name}</h3>
                        <span className="product-price">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      <p>{product.description}</p>

                      <div className="product-footer">
                        <span className={product.stock > 0 ? 'stock' : 'stock out'}>
                          {product.stock > 0
                            ? `${product.stock} in stock`
                            : 'Out of stock'}
                        </span>

                        {product.stock > 0 && quantity > 0 ? (
                          <div className="quantity-control">
                            <button
                              onClick={() => updateQuantity(product._id, -1)}
                              aria-label={`Remove one ${product.name}`}
                            >
                              −
                            </button>
                            <span>{quantity}</span>
                            <button
                              onClick={() => updateQuantity(product._id, 1)}
                              disabled={quantity >= product.stock}
                              aria-label={`Add one ${product.name}`}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            className="add-button"
                            onClick={() => addToCart(product)}
                            disabled={product.stock <= 0}
                          >
                            Add to bag <span>+</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section className="about-section" id="about">
          <span className="eyebrow">A LITTLE ABOUT US</span>
          <h2>Less fuss. More <em>good finds.</em></h2>
          <p>
            SmartShop brings your everyday shopping into one simple place.
            Browse, choose, and keep track of your bag with ease.
          </p>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon">S</span>
          <span>smart<span>shop.</span></span>
        </a>
        <p>Simple finds for everyday life.</p>
        <span>© {new Date().getFullYear()} SmartShop</span>
      </footer>

      {cartOpen && (
        <div className="cart-overlay" onClick={() => setCartOpen(false)}>
          <aside
            className="cart-panel"
            onClick={(event) => event.stopPropagation()}
            aria-label="Shopping cart"
          >
            <div className="cart-header">
              <div>
                <span className="eyebrow">YOUR SELECTION</span>
                <h2>Your bag ({cartCount})</h2>
              </div>
              <button
                className="close-cart"
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
              >
                ×
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart">
                <span>♡</span>
                <h3>Your bag is waiting</h3>
                <p>Add something you like from the collection.</p>
                <button
                  className="primary-button"
                  onClick={() => setCartOpen(false)}
                >
                  Explore products →
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item._id}>
                      <div className="cart-item-icon">✦</div>
                      <div className="cart-item-info">
                        <h3>{item.name}</h3>
                        <p>{formatPrice(item.price)}</p>
                        <div className="quantity-control">
                          <button onClick={() => updateQuantity(item._id, -1)}>
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item._id, 1)}
                            disabled={item.quantity >= item.stock}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <strong>{formatPrice(item.price * item.quantity)}</strong>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div>
                    <span>Subtotal</span>
                    <strong>{formatPrice(cartTotal)}</strong>
                  </div>
                  <p>Shipping and final totals are confirmed at checkout.</p>
                  <button className="checkout-button" disabled>
                    Checkout coming soon
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {authOpen && (
        <div className="auth-overlay" onClick={() => setAuthOpen(false)}>
          <section
            className="auth-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-cart auth-close"
              onClick={() => setAuthOpen(false)}
              aria-label="Close authentication"
            >
              ×
            </button>

            <span className="eyebrow">SMARTSHOP ACCOUNT</span>
            <h2 id="auth-title">
              {authMode === 'login' ? 'Welcome back.' : 'Create your account.'}
            </h2>
            <p className="auth-description">
              {authMode === 'login'
                ? 'Sign in to your account to continue.'
                : 'Join SmartShop and get started.'}
            </p>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <label>
                  Full name
                  <input
                    type="text"
                    value={authName}
                    onChange={(event) => setAuthName(event.target.value)}
                    placeholder="Enter your name"
                    autoComplete="name"
                    required
                    maxLength={80}
                  />
                </label>
              )}

              <label>
                Email address
                <input
                  type="email"
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete={
                    authMode === 'login' ? 'current-password' : 'new-password'
                  }
                  minLength={authMode === 'register' ? 8 : undefined}
                  required
                />
              </label>

              {authError && (
                <p className="auth-feedback auth-error" role="alert">
                  {authError}
                </p>
              )}

              {authMessage && (
                <p className="auth-feedback auth-success" role="status">
                  {authMessage}
                </p>
              )}

              <button
                className="checkout-button auth-submit"
                type="submit"
                disabled={authLoading}
              >
                {authLoading
                  ? 'Please wait...'
                  : authMode === 'login'
                    ? 'Sign in'
                    : 'Create account'}
              </button>
            </form>

            <p className="auth-switch">
              {authMode === 'login'
                ? "Don't have an account?"
                : 'Already have an account?'}
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login')
                  setAuthError('')
                  setAuthMessage('')
                  setAuthPassword('')
                }}
              >
                {authMode === 'login' ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </section>
        </div>
      )}
    </div>
  )
}

export default App