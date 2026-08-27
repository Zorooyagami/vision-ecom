import { Link, useLocation, Navigate } from 'react-router-dom'
import './Confirmation.css'

export default function Confirmation() {
  const { state } = useLocation()

  if (!state?.orderId) {
    return <Navigate to="/" replace />
  }
// window.vision?.track('order_confirmation', {
//    title: document.title,
//           screenWidth: window.innerWidth,
//           screenHeight: window.innerHeight,
//         orderId: state.orderId,
//         total: state.total,
//         email: state.email
//       })  
  return (
    <div className="confirmation-page container">
      <div className="confirmation-card card">
        <div className="success-icon">✓</div>
        <h1>Payment Successful!</h1>
        <p className="thank-you">
          Thank you for your order. A confirmation email has been sent to{' '}
          <strong>{state.email}</strong>.
        </p>

        <div className="order-details">
          <div className="detail-row">
            <span>Order ID</span>
            <strong>{state.orderId}</strong>
          </div>
          <div className="detail-row">
            <span>Total Paid</span>
            <strong>${state.total}</strong>
          </div>
        </div>

        <p className="note">
          This is a demo store. No real payment was processed and no items will be shipped.
        </p>

        <div className="actions">
          <Link to="/products" className="btn btn-primary">
            Continue Shopping
          </Link>
          <Link to="/" className="btn btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
