import { DemoApp } from './demo/DemoApp';
import './styles/demo.css';

const root = document.getElementById('app');
if (root) root.replaceWith(new DemoApp().el);
