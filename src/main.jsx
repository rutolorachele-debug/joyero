import { render } from 'preact';
import './styles.css';
import { App } from './app.jsx';
import { iniciarSquircles } from './lib/squircle.js';

render(<App />, document.getElementById('app'));
iniciarSquircles();
