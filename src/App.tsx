import { SparkNewsDashboard } from './components/SparkNewsDashboard';
import { ThemeProvider } from './context/ThemeContext';

export function App() {
  return (
    <ThemeProvider>
      <SparkNewsDashboard />
    </ThemeProvider>
  );
}

export default App;

