import { auth } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import './App.css';
import appLogo from './Images/AppLogo.png'
import Pages from './Components/Pages'
import Login from './Components/Login'
import Loading from "./Components/Loading";

function App() {

  // We can change the App Name and App Logo here for the whole web-app

  const Title = 'Pages : Digital Notebook'

  const [user, loading] = useAuthState(auth);

  return (
    <div className="Pages - Note Taking Web App">
      {
        loading === true ?
          <Loading />
          :
          <>
            {
              user ?
                <Pages Title={Title} logo={appLogo} />
                :
                <Login Title={Title} logo={appLogo} />
            }
          </>
      }
    </div>
  );
}

export default App;
