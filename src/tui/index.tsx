import React from 'react';
import { render } from 'ink';
import { ThemeProvider } from 'termui';
import { Box } from '../gui/components/ux/layout/Box.js';
import { Text } from '../gui/components/ux/typography/Text.js';
import { Spinner } from '../gui/components/ux/feedback/Spinner.js';

function App() {
  return (
    <ThemeProvider>
      <Box flexDirection="column" padding={1}>
        <Text bold>Hello, TermUI!</Text>
        <Spinner label="Loading…" />
      </Box>
    </ThemeProvider>
  );
}

render(<App />);
