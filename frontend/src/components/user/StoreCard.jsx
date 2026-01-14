function StoreCard({ store, onRate }) {
  return (
    <div className="store-card">
      <h3>{store.store_name}</h3>
      <p className="store-address">{store.store_address}</p>
      <div className="store-rating">
        <div>
          Overall Rating: <strong>{store.avg_rating.toFixed(1)}</strong> (
          {store.rating_count} ratings)
        </div>
        {store.user_rating && (
          <div>
            Your Rating: <strong>{store.user_rating}</strong>
          </div>
        )}
      </div>
      <div className="rating-buttons">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            className={`rating-btn ${
              store.user_rating === rating ? 'active' : ''
            }`}
            onClick={() => onRate(store.id, rating)}
          >
            {rating} ★
          </button>
        ))}
      </div>
    </div>
  );
}

export default StoreCard;
