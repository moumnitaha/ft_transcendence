import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState, useEffect, useRef, use } from "react";
import {
  fetchNotifications,
  acceptFriendRequest,
  declineFriendRequest,
  accept_game_invite,
  decline_game_invite,
  accept_final_game_invite,
} from "@/services/user";
import { useRouter, usePathname } from "next/navigation";
import useOutsideAlerter from "@/lib/useOutsideAlerter";
import { useContext } from "react";
import { AuthContext } from "@/lib/useAuth";

export default function Notifications() {
  const { user, setUser } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState(false);
  const ws = useRef(null);

  let router = useRouter();
  let pathname = usePathname();

  useEffect(() => {
    ws.current = new WebSocket(
      `wss://${window.location.hostname}:443/api/notification`
    );
    ws.current.onopen = () => {
    //   console.log("notification socket connected");
    };
    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "friend_request_accepted") {
        setUser((prev) => ({
          ...prev,
          notifications: {
            data,
          },
        }));
        return;
      }
      setNotifications((prev) => [...prev, data]);
      setNewNotification(true);
      if (data.type === "start_game") {
        setTimeout(() => router.push(`/game/${data.room}`), 3000);
      }
    };
    return () => {
      if (ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, []);

  useEffect(() => {
    fetchNotifications().then((res) => {
      if (res?.notifications?.length > 0) {
        setNewNotification(true);
      }
      setNotifications(res.notifications);
      setOpen(false);
    });
  }, [pathname]);

  return (
    <>
      <Button
        variant="Ghost"
        className="aspect-square shadow-md shadow-secondary p-2 rounded-lg relative"
        onClick={() => {
          setOpen((prev) => !prev);
          setNewNotification(false);
        }}
        // onBlur={() => {
        //   setTimeout(() => setOpen(false), 100);
        //   if (notifications.length > 0) setNewNotification(true);
        // }}
      >
        <Image
          src="/icons/notification.svg"
          width={24}
          height={24}
          alt="Notifications"
        />
        {newNotification && notifications.length ? (
          <div className="absolute right-0 top-0 w-5 h-5 bg-red-500 rounded-full text-white">
            {notifications.length}
          </div>
        ) : null}
      </Button>
      {open && (
        <Dropdown
          notifications={notifications}
          setNotifications={setNotifications}
          open={open}
          setOpen={setOpen}
        />
      )}
    </>
  );
}

const Dropdown = ({ notifications, setNotifications, setOpen }) => {
  const dropdownRef = useRef(null);
  const clickedOutside = useOutsideAlerter(dropdownRef);
  useEffect(() => {
    if (clickedOutside) {
      setOpen(false);
    }
  }, [clickedOutside]);

  return (
    <ul
      className="absolute right-10 top-20 z-30 bg-white rounded-lg shadow-lg"
      ref={dropdownRef}
    >
      {notifications.length === 0 && (
        <li key="no-notifications" className="p-4">
          No notifications
        </li>
      )}
      {notifications.map((notification, _) => (
        <li key={_} className="p-4 border-b flex items-center gap-2 rounded-lg">
          {notification.type === "friend_request" && (
            <>
              <p>
                <span className="font-bold">{notification.from_user}</span> sent
                you a friend request
              </p>
              <div className="flex gap-2">
                <Button
                  variant="Ghost"
                  className="text-green-500 border-green-500 hover:bg-green-200"
                  onClick={() => {
                    acceptFriendRequest({
                      friendUsername: notification.from_user,
                    }).then(() => {
                      setNotifications((prev) =>
                        prev.filter((notif, i) => i !== _)
                      );
                    });
                  }}
                >
                  Accept
                </Button>
                <Button
                  variant="Ghost"
                  className="text-red-500 border-red-500 hover:bg-red-200"
                  onClick={() =>
                    declineFriendRequest({
                      friendUsername: notification.from_user,
                    }).then(() => {
                      setNotifications((prev) =>
                        prev.filter((notif, i) => i !== _)
                      );
                    })
                  }
                >
                  Decline
                </Button>
              </div>
            </>
          )}
          {notification.type === "game_invite" && (
            <>
              <p>
                <span className="font-bold">{notification.from_user}</span>{" "}
                invited you to play a game
              </p>
              <div className="flex gap-2">
                <Button
                  variant="Ghost"
                  className="text-green-500 border-green-500 hover:bg-green-200"
                  onClick={() => {
                    accept_game_invite({
                      friendUsername: notification.from_user,
                    })
                      .then(() => {
                        setNotifications((prev) =>
                          prev.filter(
                            (notification) =>
                              notification.from_user !==
                                notification.from_user &&
                              notification.type !== "game_invite"
                          )
                        );
                      })
                      .catch((err) => {
                        // toast.error(err.toString());
                      });
                  }}
                >
                  Accept
                </Button>
                <Button
                  variant="Ghost"
                  className="text-red-500 border-red-500 hover:bg-red-200"
                  onClick={() => {
                    decline_game_invite({
                      friendUsername: notification.from_user,
                    })
                      .then(() => {
                        setNotifications((prev) =>
                          prev.filter(
                            (notification) =>
                              notification.from_user !==
                                notification.from_user &&
                              notification.type !== "game_invite"
                          )
                        );
                      })
                      .catch((err) => {
                        // toast.error(err.toString());
                      });
                  }}
                >
                  Decline
                </Button>
              </div>
            </>
          )}
          {notification.type === "final_game_invite" && (
            <>
              <p>
                <span className="font-bold">{notification.from_user}</span>{" "}
                invited you to play a game in the tournament
              </p>
              <div className="flex gap-2">
                <Button
                  variant="Ghost"
                  className="text-white border-green-500 bg-green-500 hover:bg-green-200"
                  onClick={() => {
                    accept_final_game_invite({
                      room: notification.room,
                    })
                      .then(() => {
                        setNotifications((prev) =>
                          prev.filter(
                            (notification) =>
                              notification.from_user !==
                                notification.from_user &&
                              notification.type !== "game_invite"
                          )
                        );
                      })
                      .catch((err) => {
                        // toast.error(err.toString());
                      });
                  }}
                >
                  JOIN NOW
                </Button>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
};
