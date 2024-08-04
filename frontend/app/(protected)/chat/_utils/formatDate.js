import moment from 'moment';
export default function formatMessageTime(created_at) {
    const messageTime = moment(created_at);
    const now = moment();
  
    const minutesDifference = now.diff(messageTime, 'minutes');
    const hoursDifference = now.diff(messageTime, 'hours');
  
  
    if (minutesDifference < 1) {
      return "now"
    } else if (minutesDifference < 60) {
      return messageTime.format('hh:mm A');
    } else if (hoursDifference < 24) {
      return messageTime.format('hh:mm A');
    } else 
    return messageTime.format('YYYY-MM-DD ');
  };