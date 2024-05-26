import { useState } from 'react';
import Dice from '../../components/Dice/Dice';
import axios from 'axios';

const DicePage = () => {
  const [balance, setBalance] = useState(0);

  const handleRoll = async (result: number) => {
    try {
      const response = await axios.post('https://example.com/api/roll', { result });
      setBalance(response.data.balance);
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100vh' }}>
      <h1>User Balance: {balance}</h1>
      <div style={{ width: '400px', height: '400px' }}>
        <Dice onRoll={handleRoll} />
      </div>
    </div>
  );
};

export default DicePage;
