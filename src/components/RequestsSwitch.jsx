import { useOutletContext } from 'react-router-dom';
import Requests from '../pages/Requests';
import ProviderRequests from '../pages/app/ProviderRequests';

export default function RequestsSwitch() {
  const { user } = useOutletContext();
  const isProvider = user?.role === 'provider';
  return isProvider ? <ProviderRequests /> : <Requests />;
}
