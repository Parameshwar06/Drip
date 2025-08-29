import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Code,
  Paper
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const ArduinoUploadGuide = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      label: 'Install Arduino IDE',
      content: (
        <Box>
          <Typography variant="body1" gutterBottom>
            Download and install the Arduino IDE from the official website.
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Download:</strong> https://www.arduino.cc/en/software
          </Alert>
          <List>
            <ListItem>
              <ListItemText primary="1. Download Arduino IDE 2.0 or later" />
            </ListItem>
            <ListItem>
              <ListItemText primary="2. Install with default settings" />
            </ListItem>
            <ListItem>
              <ListItemText primary="3. Launch Arduino IDE" />
            </ListItem>
          </List>
        </Box>
      )
    },
    {
      label: 'Install ESP32 Board Support',
      content: (
        <Box>
          <Typography variant="body1" gutterBottom>
            Add ESP32 board support to Arduino IDE.
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="1. Go to File → Preferences" />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="2. Add this URL to 'Additional Boards Manager URLs':" 
                secondary="https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json"
              />
            </ListItem>
            <ListItem>
              <ListItemText primary="3. Go to Tools → Board → Boards Manager" />
            </ListItem>
            <ListItem>
              <ListItemText primary="4. Search for 'esp32' and install 'esp32 by Espressif Systems'" />
            </ListItem>
          </List>
        </Box>
      )
    },
    {
      label: 'Install Required Libraries',
      content: (
        <Box>
          <Typography variant="body1" gutterBottom>
            Install the necessary libraries for Firebase and JSON handling.
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="1. Go to Tools → Manage Libraries" />
            </ListItem>
            <ListItem>
              <ListItemText primary="2. Search and install these libraries:" />
            </ListItem>
          </List>
          <Box sx={{ ml: 4 }}>
            <Chip label="ArduinoJson by Benoit Blanchon" sx={{ m: 0.5 }} />
            <Chip label="Firebase ESP32 Client by Mobizt" sx={{ m: 0.5 }} />
            <Chip label="WiFi by Arduino" sx={{ m: 0.5 }} />
            <Chip label="EEPROM by Arduino" sx={{ m: 0.5 }} />
          </Box>
        </Box>
      )
    },
    {
      label: 'Configure Board Settings',
      content: (
        <Box>
          <Typography variant="body1" gutterBottom>
            Configure Arduino IDE for your ESP32 board.
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="1. Go to Tools → Board → esp32 → ESP32 Dev Module" />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="2. Select your COM port: Tools → Port → COM5 (CH9102)" 
                secondary="Your ESP32 should appear as CH9102 USB serial port"
              />
            </ListItem>
            <ListItem>
              <ListItemText primary="3. Set Upload Speed to 115200" />
            </ListItem>
            <ListItem>
              <ListItemText primary="4. Set Flash Mode to QIO" />
            </ListItem>
            <ListItem>
              <ListItemText primary="5. Set Flash Size to 4MB (32Mb)" />
            </ListItem>
          </List>
        </Box>
      )
    },
    {
      label: 'Upload the Code',
      content: (
        <Box>
          <Typography variant="body1" gutterBottom>
            Copy and upload the ESP32 firmware code.
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Make sure your ESP32 is connected via USB cable to COM5
          </Alert>
          <List>
            <ListItem>
              <ListItemText primary="1. Create a new Arduino sketch" />
            </ListItem>
            <ListItem>
              <ListItemText primary="2. Copy the ESP32 code from the file: esp32-drip-device-simple.ino" />
            </ListItem>
            <ListItem>
              <ListItemText primary="3. Paste it into the Arduino IDE" />
            </ListItem>
            <ListItem>
              <ListItemText primary="4. Click the Upload button (→)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="5. Wait for 'Done uploading' message" />
            </ListItem>
          </List>
          
          <Paper sx={{ p: 2, mt: 2, bgcolor: '#1e1e1e', color: '#fff' }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '12px' }}>
{`// Expected upload output:
Sketch uses 1048576 bytes (80%) of program storage space.
Global variables use 41984 bytes (12%) of dynamic memory.
esptool.py v4.2.1
Serial port COM5
Connecting........_____....._____....._____....._____
Chip is ESP32-D0WDQ6 (revision 1)
Features: WiFi, BT, Dual Core, 240MHz, VRef calibration in efuse, Coding Scheme None
Crystal is 40MHz
MAC: aa:bb:cc:dd:ee:ff
Uploading stub...
Running stub...
Stub running...
Writing at 0x00001000... (100%)
Wrote 1048576 bytes (672503 compressed) at 0x00001000 in 15.2 seconds
Hard resetting via RTS pin...
Done uploading.`}
            </Typography>
          </Paper>
        </Box>
      )
    },
    {
      label: 'Test Device',
      content: (
        <Box>
          <Typography variant="body1" gutterBottom>
            Verify the ESP32 is working correctly.
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="1. Open Arduino IDE Serial Monitor (Ctrl+Shift+M)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="2. Set baud rate to 115200" />
            </ListItem>
            <ListItem>
              <ListItemText primary="3. Reset your ESP32 (press EN button)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="4. You should see startup messages with emojis 🌱" />
            </ListItem>
            <ListItem>
              <ListItemText primary="5. Look for 'WiFi AP Started' message" />
            </ListItem>
            <ListItem>
              <ListItemText primary="6. LED should turn ON indicating config mode" />
            </ListItem>
          </List>
          
          <Paper sx={{ p: 2, mt: 2, bgcolor: '#1e1e1e', color: '#00ff00' }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '12px' }}>
{`🌱 ESP32 Drip Irrigation System Starting...
📶 Creating WiFi Access Point: ESP32_Drip_A1B2C3
🔑 Password: 12345678
🌐 Server started at: 192.168.4.1
💡 LED ON - Configuration mode active
⏰ Waiting for configuration...`}
            </Typography>
          </Paper>
        </Box>
      )
    }
  ];

  const troubleshootingSteps = [
    {
      issue: "COM port not found",
      solutions: [
        "Install CH340/CH341 or CP2102 drivers",
        "Try different USB cables",
        "Check Device Manager for unknown devices",
        "Try different USB ports"
      ]
    },
    {
      issue: "Upload failed / Connection timeout",
      solutions: [
        "Hold BOOT button while clicking Upload",
        "Press EN button to reset, then try upload",
        "Lower upload speed to 57600",
        "Check if another program is using the COM port"
      ]
    },
    {
      issue: "Libraries not found",
      solutions: [
        "Update Arduino IDE to latest version",
        "Install libraries manually from GitHub",
        "Check library dependencies",
        "Restart Arduino IDE after installation"
      ]
    },
    {
      issue: "ESP32 not creating WiFi network",
      solutions: [
        "Check serial output for errors",
        "Verify code uploaded successfully",
        "Try different power source",
        "Hold BOOT button for 3 seconds to force config mode"
      ]
    }
  ];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          color: 'white'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
          📤 ESP32 Arduino Upload Guide
        </Typography>
        <Typography variant="subtitle2" sx={{ opacity: 0.9, mt: 1 }}>
          Step-by-step instructions to upload firmware to your ESP32
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={index}>
              <StepLabel>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  {step.label}
                </Typography>
              </StepLabel>
              <StepContent>
                <Box sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  {step.content}
                </Box>
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mt: 1, mr: 1 }}
                    disabled={activeStep === steps.length - 1}
                  >
                    {activeStep === steps.length - 1 ? 'Finish' : 'Continue'}
                  </Button>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1, color: 'white' }}
                  >
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {activeStep === steps.length && (
          <Paper sx={{ p: 3, my: 3, background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
            <Typography variant="h6" sx={{ color: '#4caf50', mb: 2, display: 'flex', alignItems: 'center' }}>
              <CheckIcon sx={{ mr: 1 }} />
              Upload Complete!
            </Typography>
            <Typography sx={{ color: 'white', mb: 2 }}>
              Your ESP32 is now ready. Next steps:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="1. Look for ESP32_Drip_XXXXXX WiFi network"
                  sx={{ color: 'white' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="2. Connect with password: 12345678"
                  sx={{ color: 'white' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="3. Go to 192.168.4.1 in your browser"
                  sx={{ color: 'white' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="4. Follow the device setup wizard"
                  sx={{ color: 'white' }}
                />
              </ListItem>
            </List>
            <Button onClick={handleReset} sx={{ mt: 2, color: 'white' }}>
              Reset Guide
            </Button>
          </Paper>
        )}

        {/* Troubleshooting Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
            🔧 Troubleshooting
          </Typography>
          
          {troubleshootingSteps.map((item, index) => (
            <Accordion 
              key={index}
              sx={{ 
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                  <ErrorIcon sx={{ mr: 1, color: '#f44336' }} />
                  {item.issue}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {item.solutions.map((solution, sIndex) => (
                    <ListItem key={sIndex}>
                      <ListItemText 
                        primary={solution}
                        sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} sx={{ color: 'white' }}>
          Close Guide
        </Button>
        <Button 
          variant="contained" 
          onClick={onClose}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          Start Device Setup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArduinoUploadGuide;
