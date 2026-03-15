import { useOutletContext } from 'react-router-dom';
import { isProviderUser } from '../hooks/useAppData';
import Requests from '../pages/Requests';
import ProviderRequests from '../pages/app/ProviderRequests';

export default function RequestsSwitch() {
  const { user } = useOutletContext();
  const isProvider = isProviderUser(user);
  return isProvider ? <ProviderRequests /> : <Requests />;
}
