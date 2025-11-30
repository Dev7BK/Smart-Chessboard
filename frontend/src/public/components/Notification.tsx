import { useNotification } from "../../context/notification/useNotification";
import closeWhiteIcon from "icons/eh-cancel-white.svg";
import "../scss/notification.scss";

const Notification = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification--${notification.type}`}
        >
          <div className="notification__content">
            <span className="notification__message">
              {notification.message}
            </span>
            <button
              className="notification__close-button"
              onClick={() => removeNotification(notification.id)}
              aria-label="Close notification"
            >
              <img
                src={closeWhiteIcon}
                alt="Close"
                className="notification__close-icon"
              />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Notification;
