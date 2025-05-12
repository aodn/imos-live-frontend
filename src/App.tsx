import { Route, Routes } from 'react-router-dom';
import { Map as MapPage, Landing as LandingPage } from '@/pages';
import { Layout } from '@/components';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<MapPage />} />
        <Route path="/landing" element={<LandingPage />} />
      </Route>
    </Routes>
  );
}
export default App;

/**
 * When to Use Memoization in React 19, as React 19 has introduced
 * automatic optimizations for functional components, the need for manual
 * memoization has decreased. However, there are still scenarios where
 * manual memoization is beneficial:
 * 
1. Expensive Calculations
Even with automatic optimizations, you should still explicitly memoize computationally intensive operations:

Complex data transformations
Heavy mathematical calculations
Operations with O(n²) or worse complexity

2. Complex Data Structures
For deeply nested objects or large arrays where:

You need guaranteed reference stability across renders
The data structure is used by multiple components or hooks
Changes to the data need to be precisely controlled

3. Performance-Critical Applications
In scenarios where performance fine-tuning is essential:

Animations and transitions that must maintain 60fps
Data visualization with frequent updates
Applications with significant state management complexity

4. External Library Compatibility
When working with libraries that:

Explicitly require stable function references
Check for reference equality to determine if data has changed
Have their own memoization systems that depend on stable references
 */
