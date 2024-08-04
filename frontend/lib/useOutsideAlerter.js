import { useEffect, useState } from "react";

function isAnyParentButton(element) {
  let currentNode = element;

  while (currentNode) {
    if (currentNode.nodeName === "BUTTON") {
      return true;
    }
    currentNode = currentNode.parentNode;
  }

  return false;
}
/**
 * Hook that alerts clicks outside of the passed ref
 */
export default function useOutsideAlerter(ref) {
  const [clickedOutside, setClickedOutside] = useState(false);

  useEffect(() => {
    /**
     * Alert if clicked on outside of element
     */
    function handleClickOutside(event) {
      //   console.log("event.target.nodeName", event.target.nodeName);
      if (
        ref.current &&
        !ref.current.contains(event.target) &&
        event.target.nodeName !== "BUTTON" &&
        !isAnyParentButton(event.target)
      ) {
        setClickedOutside(true);
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);

  return clickedOutside;
}
