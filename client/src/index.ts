import { DemoApp } from './demo/DemoApp';
import './styles/legacy-demo.css';

const root = document.getElementById('app');
if (root) root.replaceWith(new DemoApp().el);
