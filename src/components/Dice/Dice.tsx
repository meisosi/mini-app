import { useState, useRef, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, Euler, Vector3 } from 'three';
import axios from 'axios';
import './Dice.css';

interface DiceMeshProps {
    textures: TextureLoader;
    rotationSpeed: Vector3;
    finalRotation: Euler;
    rolling: boolean;
}

const DiceMesh: React.FC<DiceMeshProps> = ({ textures, rotationSpeed, finalRotation, rolling }) => {
    const diceRef = useRef();

    useFrame(() => {
        if (diceRef.current) {
            if (rolling) {
                diceRef.current.rotation.x += rotationSpeed.x;
                diceRef.current.rotation.y += rotationSpeed.y;
                diceRef.current.rotation.z += rotationSpeed.z;
            } else {
                diceRef.current.rotation.set(finalRotation.x, finalRotation.y, finalRotation.z);
            }
        }
    });


    return (
        <mesh ref={diceRef}>
            <boxGeometry args={[2, 2, 2]} />
            {textures.map((texture, index) => (
                <meshStandardMaterial attach={`material-${index}`} map={texture} key={index} />
            ))}
        </mesh>
    );
};

const Dice = ({ onRoll }) => {
    const [rolling, setRolling] = useState(false);
    const [balance, setBalance] = useState(0);
    const [result, setResult] = useState(1);
    const [rotationSpeed, setRotationSpeed] = useState(new Vector3(0, 0, 0));
    const [finalRotation, setFinalRotation] = useState(new Euler(0, 0, 0));
    const [isMobile, setIsMobile] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const shakeThreshold = 28; // Фиксированный порог тряски

    const textures = useLoader(TextureLoader, [
        '/textures/dice1.png', // 1
        '/textures/dice2.png', // 2
        '/textures/dice3.png', // 3
        '/textures/dice4.png', // 4
        '/textures/dice6.png', // 5
        '/textures/dice5.png', // 6
    ]);

    useEffect(() => {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        if (/android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            setIsMobile(true);
        } else {
            setIsMobile(false);
        }

        const rotations = {
            1: new Euler(0, 0, 0),
            2: new Euler(0, Math.PI / 2, 0),
            3: new Euler(Math.PI / 2, 0, 0),
            4: new Euler(-Math.PI / 2, 0, 0),
            5: new Euler(0, -Math.PI / 2, 0),
            6: new Euler(Math.PI, 0, 0),
        };

        const handleMotion = (event) => {
            const { acceleration } = event;
            if (acceleration && !rolling) {
                const totalAcceleration = Math.sqrt(acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2);
                if (totalAcceleration > shakeThreshold) {
                    setRolling(true);
                    setRotationSpeed(new Vector3(0.2, 0.2, 0.2));

                    setTimeout(() => {
                        const newResult = Math.floor(Math.random() * 6) + 1;
                        setResult(newResult);
                        setFinalRotation(rotations[newResult]);

                        if (onRoll) {
                            onRoll(newResult);
                        }

                        // Update balance after roll
                        axios.post('http://localhost:3000/reward', { number: newResult })
                            .then(response => setBalance(response.data.balance))
                            .catch(error => console.error('Error updating balance:', error));

                        setRotationSpeed(new Vector3(0, 0, 0));
                        setRolling(false);
                    }, 1000);
                }
            }
        };

        if (permissionGranted) {
            window.addEventListener('devicemotion', handleMotion);
        }

        return () => {
            if (permissionGranted) {
                window.removeEventListener('devicemotion', handleMotion);
            }
        };
    }, [rolling, permissionGranted, onRoll]);

    const requestPermission = async () => {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceMotionEvent.requestPermission();
                if (permission === 'granted') {
                    console.log('DeviceMotionEvent permission granted');
                    setPermissionGranted(true);
                } else {
                    console.warn('Permission to access device motion was denied.');
                }
            } catch (error) {
                console.error('Error requesting device motion permission:', error);
            }
        } else {
            console.log('DeviceMotionEvent.requestPermission is not defined');
            setPermissionGranted(true);
        }
    };

    const [gameStarted, setGameStarted] = useState(false);
    const [buttonVisible, setButtonVisible] = useState(true);

    const handleStartGame = () => {
        if (!permissionGranted) {
            requestPermission();
        } else {
            setGameStarted(true);
            setButtonVisible(false);
        }
    };



    if (!isMobile) {
        return <div className="message">This game is only available on mobile devices.</div>;
    }

    return (
        <div className="container">
            {!rolling && !gameStarted && buttonVisible && (
            <button className="start-button" onClick={handleStartGame}>Начать игру</button>
        )}


            <Canvas className="canvas">
                <ambientLight />
                <pointLight position={[10, 10, 10]} />
                <Suspense fallback={null}>
                    <DiceMesh textures={textures} rotationSpeed={rotationSpeed} finalRotation={finalRotation} rolling={rolling} />
                </Suspense>
            </Canvas>
            <div className="info">
                <div>Balance: {balance}</div>
                <div>Result: {result}</div>
            </div>
        </div>
    );
};

export default Dice;
