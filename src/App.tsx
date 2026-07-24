import React, { useState, useEffect, useRef } from 'react';
import { Settings, CheckCircle2, Link as LinkIcon, Plus, Trash2, ShoppingBag,
Ticket, Sparkles, Anchor, Castle, ExternalLink, ArrowRight, ArrowLeft, Edit3,
Calendar, Upload, FolderInput, Copy, RotateCcw, Star, List, Map, X, Utensils,
FerrisWheel, Search, ChevronDown, ChevronUp, Image as ImageIcon, Palette, ClipboardList, GalleryVertical, Navigation, BookOpen, Heart, Camera } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const FETCH_URLS = {
  todo: `https://docs.google.com/spreadsheets/d/e/2PACX-1vRje60W_cKpfMVkve6yefpGxOLkDgOt7DMSNqA03N6Hdkn0aGKhVY4T-6r-2FQVaMRWQJ6bmcdUU8wt/pub?gid=1621130&single=true&output=csv`,
  news: `https://docs.google.com/spreadsheets/d/e/2PACX-1vRje60W_cKpfMVkve6yefpGxOLkDgOt7DMSNqA03N6Hdkn0aGKhVY4T-6r-2FQVaMRWQJ6bmcdUU8wt/pub?gid=1795040225&single=true&output=csv`,
  facilities: `https://docs.google.com/spreadsheets/d/e/2PACX-1vRje60W_cKpfMVkve6yefpGxOLkDgOt7DMSNqA03N6Hdkn0aGKhVY4T-6r-2FQVaMRWQJ6bmcdUU8wt/pub?gid=1441183205&single=true&output=csv`,
  about: `https://docs.google.com/spreadsheets/d/e/2PACX-1vRje60W_cKpfMVkve6yefpGxOLkDgOt7DMSNqA03N6Hdkn0aGKhVY4T-6r-2FQVaMRWQJ6bmcdUU8wt/pub?gid=1639751527&single=true&output=csv`,
};

type FacilityType = 'ride' | 'show' | 'food' | 'shop';
type FacilityStatus = '營運中' | '維修中' | '暫停營運';

interface Facility {
  id: string;
  park: 'land' | 'sea';
  category: FacilityType;
  name: string;
  enName: string;
  status: FacilityStatus;
  lat: number;
  lng: number;
}

const DEFAULT_FACILITIES: Facility[] = [
  { id: 'f01', park: 'land', category: 'shop', name: '便士拱廊', enName: 'Penny Arcade', status: '營運中', lat: 35.6329, lng: 139.8804 },
  { id: 'f27', park: 'land', category: 'ride', name: '太空山', enName: 'Space Mountain', status: '維修中', lat: 35.6338, lng: 139.8818 },
  { id: 'f24', park: 'land', category: 'ride', name: '美女與野獸「城堡奇緣」', enName: 'Beauty and the Beast', status: '營運中', lat: 35.6345, lng: 139.8825 },
  { id: 's01', park: 'sea', category: 'ride', name: '翱翔:夢幻奇航', enName: 'Soaring', status: '營運中', lat: 35.6267, lng: 139.8851 },
];

const CATEGORIES: { id: FacilityType; label: string; icon: any }[] = [
  { id: 'ride', label: '設施', icon: FerrisWheel },
  { id: 'show', label: '表演', icon: Ticket },
  { id: 'food', label: '餐廳', icon: Utensils },
  { id: 'shop', label: '商店', icon: ShoppingBag },
];

const DEFAULT_DATA = {
  userProfile: { name: "請輸入名字", visitDate: "", coverImage: "", coverPositionY: 50, coverScale: 1, theme: "cream" },
  todo: [
    {
      id: 'g1', title: '事前準備', items: [
        {
          id: 't1', title: '選擇入園日', done: false,
          subs: [
            { id: 's1_1', title: '入園日選擇教學', done: false, link: 'https://www.threads.com/@tnnodisney/post/DO0sGj8krkk' },
          ]
        }
      ]
    }
  ],
  news: {
    landGuides: [
      { category: '認識園區', title: '中文地圖', link: 'https://www.threads.net/' },
      { category: '爆米花地圖', title: '兩種口味爆米花桶', link: 'https://www.threads.net/' }
    ],
    seaGuides: [
      { category: '認識園區', title: '海洋中文地圖', link: 'https://www.threads.net/' }
    ],
    events: [
      {
        id: 'e1', title: '🧸 玩具總動員 5 同樂時光', link: '', date: '2026/07/02 - 2026/9/14',
        quickLinks: [
          { label: '餐點地圖', link: 'https://www.threads.net/' },
          { label: '活動懶人包', link: 'https://www.threads.net/' }
        ]
      }
    ],
    products: [
      { id: 'p1', title: '小姐與流氓系列', link: 'https://www.threads.net/', date: '2024.11.18 上市' }
    ]
  },
  about: {
    lastUpdate: '2026/07/23',
    updateNotice: '固定每月 1 號更新，無法完全及時！有需要請自行調整內容！',
    disclaimer: '此 App 非官方製作，內容僅供參考。請以官方資訊為準，勿作商業用途。',
    igUrl: 'https://www.instagram.com/tnnodisney',
    threadsUrl: 'https://www.threads.net/@tnnodisney',
    sponsorUrl: 'https://portaly.cc/tnnodisney',
    feedbackUrl: 'https://portaly.cc/tnnodisney'
  },
  plan: { land: [] as any[], sea: [] as any[] },
  myList: [{ id: 'b1', title: '記得新增你的清單!', link: '', done: false }],
  favorites: [] as string[]
};

const THEMES: any = {
  cream: { name: "奶油杏", bg: "bg-[#f0e0c9]/30", primary: "bg-[#f0e0c9]", text: "text-[#bfa588]", border: "border-[#f0e0c9]", buttonText: "text-[#8c6d4f]" },
  purple: { name: "香芋紫", bg: "bg-[#c1b4e0]/20", primary: "bg-[#c1b4e0]", text: "text-[#9686bf]", border: "border-[#c1b4e0]", buttonText: "text-[#6b5899]" },
  green: { name: "抹茶綠", bg: "bg-[#b6cf50]/20", primary: "bg-[#b6cf50]", text: "text-[#8ea33e]", border: "border-[#b6cf50]", buttonText: "text-[#5e6d1e]" },
  cyan: { name:"海鹽藍", bg: "bg-[#79c1cd]/20", primary: "bg-[#79c1cd]", text: "text-[#5b9ca8]", border: "border-[#79c1cd]", buttonText: "text-[#366c77]" },
  blue: { name:"深海藍", bg: "bg-[#43669e]/10", primary: "bg-[#43669e]", text: "text-[#43669e]", border: "border-[#43669e]", buttonText: "text-white" },
  pink: { name:"櫻花粉", bg: "bg-[#f0c8c8]/20", primary: "bg-[#f0c8c8]", text: "text-[#d69696]", border: "border-[#f0c8c8]", buttonText: "text-[#a35b5b]" },
};

const parseCSV = (text: string) => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField.trim());
      if (currentRow.some(cell => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(cell => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.replace(/^"|"$/g, '').trim());
  return rows.slice(1).map(row => {
    const obj: any = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] ? row[idx].replace(/^"|"$/g, '').trim() : '';
    });
    return obj;
  });
};

const CircularProgress = ({ percentage, colorClass }: { percentage: number, colorClass: string }) => {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  return (
    <div className="relative w-6 h-6 flex items-center justify-center">
      <svg className="transform -rotate-90 w-full h-full">
        <circle cx="12" cy="12" r={radius} stroke="#f3f4f6" strokeWidth="3" fill="transparent" />
        <circle cx="12" cy="12" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className={colorClass} strokeLinecap="round" />
      </svg>
    </div>
  );
};

const getDaysUntil = (dateStr: string) => {
  if (!dateStr) return 0;
  const target = new Date(dateStr);
  const today = new Date();
  const diff = target.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 3600 * 24));
  return days > 0 ? days : 0;
};

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
    };
  });
};

const getFaviconUrl = (url: string) => {
  if (!url || url === '#') return null;
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch (e) {
    return null;
  }
};

interface ItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, link: string) => void;
  initialTitle: string;
  initialLink: string;
  tm: any;
}
const ItemEditModal: React.FC<ItemEditModalProps> = ({ isOpen, onClose, onSave, initialTitle, initialLink, tm }) => {
  const [title, setTitle] = useState(initialTitle);
  const [link, setLink] = useState(initialLink);
  const safeTm = tm || THEMES.cream;

  useEffect(() => {
    setTitle(initialTitle);
    setLink(initialLink);
  }, [initialTitle, initialLink, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-lg text-gray-800 text-center">編輯項目</h3>
        
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1">項目名稱</label>
          <input 
            type="text" 
            className="w-full p-3 bg-gray-100 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-stone-400"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="請輸入名稱"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1">連結網址 (選填)</label>
          <input 
            type="text" 
            className="w-full p-3 bg-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-stone-400"
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 font-bold text-gray-600 rounded-xl text-sm hover:bg-gray-200">
            取消
          </button>
          <button 
            onClick={() => { onSave(title, link); onClose(); }} 
            className={`flex-1 py-3 ${safeTm.primary} ${safeTm.buttonText || 'text-gray-800'} font-bold rounded-xl text-sm shadow-md hover:opacity-90 active:scale-95 transition-all`}
          >
            儲存
          </button>
        </div>
      </div>
    </div>
  );
};

function PlanItem({ id, item, onDelete, index, tm }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { 
    transform: CSS.Translate.toString(transform), 
    transition, 
    opacity: isDragging ? 0.85 : 1 
  };
  const safeTm = tm || THEMES.cream;
  
  const getIcon = (type: string) => {
    const cat = CATEGORIES.find(c => c.id === type);
    const Icon = cat ? cat.icon : Sparkles;
    return <Icon size={18} className="text-gray-500 shrink-0"/>;
  };

  const getStatusColor = (status: string) => {
    if (status === '維修中') return 'text-red-500 bg-red-50 border-red-100';
    if (status === '暫停營運') return 'text-orange-500 bg-orange-50 border-orange-100';
    return 'text-green-600 bg-green-50 border-green-100';
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className={`bg-white p-3.5 mb-2 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between touch-none select-none active:scale-[0.98] transition-all w-full box-border ${isDragging ? 'shadow-xl border-stone-300 ring-2 ring-stone-200 z-50 bg-white' : ''}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${safeTm.bg} ${safeTm.text}`}>
          {index}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5 min-w-0">
            {getIcon(item.category)}
            <span className="text-gray-800 font-bold text-[15px] truncate shrink-0 max-w-[200px] sm:max-w-xs">{item.title}</span>
          </div>
          {item.enName && <span className="text-xs text-gray-400 truncate block shrink-0">{item.enName}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {item.status && item.status !== '營運中' && (
          <span className={`text-xs px-2.5 py-0.5 rounded-full border mr-1 font-medium shrink-0 ${getStatusColor(item.status)}`}>{item.status}</span>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(id); }} 
          className="text-gray-300 hover:text-red-400 p-1.5 rounded-lg active:bg-gray-100 transition-colors shrink-0"
        >
          <Trash2 size={16}/>
        </button>
      </div>
    </div>
  );
}

function TodoItem({ item, onToggle, onOpenMenu, tm }: any) { 
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { 
    transform: CSS.Translate.toString(transform), 
    transition, 
    opacity: isDragging ? 0.85 : 1 
  };
  const safeTm = tm || THEMES.cream; 
  const lastTapRef = useRef<number>(0);

  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent, subId?: string) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onOpenMenu(item.id, subId);
    }
    lastTapRef.current = now;
  };

  const mainFavicon = item.link ? getFaviconUrl(item.link) : null;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3 relative select-none transition-shadow touch-none w-full box-border ${isDragging ? 'shadow-xl border-stone-300 ring-2 ring-stone-200 z-50 bg-white' : ''}`}
      {...attributes} 
      {...listeners}
      onClick={(e) => handleDoubleTap(e)}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onToggle(item.id); }} 
        className={`mt-0.5 min-w-[24px] h-[24px] rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${item.done ? `${safeTm.primary} border-transparent` : 'border-gray-300 bg-white'}`}
      >
        {item.done && <CheckCircle2 size={16} className="text-white" />}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <span className={`block font-semibold text-[15px] leading-snug ${item.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
            {item.title}
          </span>
          
          {item.link && item.link !== '#' && (
            <a href={item.link} target="_blank" rel="noreferrer" className="shrink-0 p-0.5" onClick={e => e.stopPropagation()}>
              {mainFavicon ? (
                <img src={mainFavicon} alt="icon" className="w-5 h-5 rounded-md object-contain opacity-80 hover:opacity-100" />
              ) : (
                <div className="text-stone-500 bg-stone-100 p-1 rounded-lg"><LinkIcon size={14}/></div>
              )}
            </a>
          )}
        </div>

        {item.subs && item.subs.length > 0 && (
          <div className="mt-2.5 space-y-2.5">
            {item.subs.map((sub:any) => {
              const subFavicon = sub.link ? getFaviconUrl(sub.link) : null;
              return (
                <div key={sub.id} className="flex items-center gap-3 py-0.5 cursor-pointer" onClick={(e) => handleDoubleTap(e, sub.id)}>
                  <div 
                    onClick={(e) => { e.stopPropagation(); onToggle(item.id, sub.id); }} 
                    className={`min-w-[20px] h-[20px] rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${sub.done ? `${safeTm.primary} border-transparent` : 'border-gray-300 bg-white'}`}
                  >
                    {sub.done && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                  
                  <span className={`flex-1 text-sm ${sub.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {sub.title}
                  </span>
                  
                  {sub.link && sub.link !== '#' && (
                    <a href={sub.link} target="_blank" rel="noreferrer" className="shrink-0 p-0.5" onClick={e => e.stopPropagation()}>
                      {subFavicon ? (
                        <img src={subFavicon} alt="icon" className="w-[18px] h-[18px] rounded-md object-contain opacity-80 hover:opacity-100" />
                      ) : (
                        <ExternalLink size={15} className="text-gray-300 hover:text-stone-500"/>
                      )}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionMenu({ isOpen, onClose, onAction, itemType }: any) {
  if (!isOpen) return null;
  const isSub = itemType === 'sub';
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-[2rem] p-6 pb-10 animate-in slide-in-from-bottom-full duration-300" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
        <h3 className="text-center font-bold text-gray-800 mb-6 text-lg">編輯項目</h3>
        <div className="grid grid-cols-4 gap-4">
          <button onClick={() => onAction('edit_combined')} className="flex flex-col items-center gap-2 text-gray-600 active:scale-95">
            <div className="p-4 bg-gray-100 rounded-2xl"><Edit3 size={24}/></div>
            <span className="text-xs font-bold">編輯</span>
          </button>
          {!isSub && <button onClick={() => onAction('indent')} className="flex flex-col items-center gap-2 text-gray-600 active:scale-95"><div className="p-4 bg-gray-100 rounded-2xl"><ArrowRight size={24}/></div><span className="text-xs font-bold">縮排</span></button>}
          {isSub && <button onClick={() => onAction('outdent')} className="flex flex-col items-center gap-2 text-gray-600 active:scale-95"><div className="p-4 bg-gray-100 rounded-2xl"><ArrowLeft size={24}/></div><span className="text-xs font-bold">升級</span></button>}
          <button onClick={() => onAction('move')} className="flex flex-col items-center gap-2 text-gray-600 active:scale-95"><div className="p-4 bg-gray-100 rounded-2xl"><FolderInput size={24}/></div><span className="text-xs font-bold">移動</span></button>
          <button onClick={() => onAction('delete')} className="flex flex-col items-center gap-2 text-red-500 active:scale-95"><div className="p-4 bg-red-50 rounded-2xl"><Trash2 size={24}/></div><span className="text-xs font-bold">刪除</span></button>
        </div>
        <button onClick={onClose} className="w-full mt-8 py-3 rounded-xl bg-gray-100 font-bold text-gray-600">取消</button>
      </div>
    </div>
  );
}

// 💡 「關於」彈窗（Info 頁面）：問題回饋區塊已改用真實 Emoji 💬
interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  aboutData: any;
  tm: any;
}
const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, onOpenSettings, aboutData, tm }) => {
  if (!isOpen) return null;
  const info = aboutData || DEFAULT_DATA.about;
  const safeTm = tm || THEMES.cream;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-6 shadow-2xl border border-white flex flex-col space-y-4 my-auto">
        
        {/* 頂部 Logo 與設定 */}
        <div className="flex justify-between items-center border-b pb-3">
          <img 
            src="/D_3.png" 
            alt="be reaDy" 
            className="h-10 w-auto object-contain"
            onError={(e: any) => { e.target.onerror = null; e.target.src = '/logo_dark.svg'; }}
          />
          
          <button 
            onClick={() => { onClose(); onOpenSettings(); }} 
            className={`text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all active:scale-95 ${safeTm.bg} ${safeTm.text} ${safeTm.border}`}
          >
            ⚙️ 調整設定
          </button>
        </div>

        {/* 歡迎文案 */}
        <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100 text-center">
          <p className="text-xs font-bold text-gray-700">歡迎追蹤社群看更多攻略！ ✨</p>
        </div>

        {/* 社群雙欄按鈕 (IG & Threads) */}
        <div className="grid grid-cols-2 gap-2.5">
          <a 
            href={info.igUrl || 'https://www.instagram.com/tnnodisney'} 
            target="_blank" 
            rel="noreferrer" 
            className="flex items-center justify-center py-3 px-3 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white rounded-2xl font-bold text-xs shadow-sm hover:opacity-90 active:scale-95 transition-all gap-1.5"
          >
            <Camera size={16}/> Instagram
          </a>
          <a 
            href={info.threadsUrl || 'https://www.threads.net/@tnnodisney'} 
            target="_blank" 
            rel="noreferrer" 
            className="flex items-center justify-center py-3 px-3 bg-black text-white rounded-2xl font-bold text-xs shadow-sm hover:bg-gray-800 active:scale-95 transition-all gap-1.5"
          >
            <span className="font-black text-sm">@</span> Threads
          </a>
        </div>

        {/* 小額贊助區塊 */}
        <div className="bg-gradient-to-br from-[#6ed4d6] to-[#4ab3b6] p-5 rounded-[1.8rem] text-white text-center shadow-md relative overflow-hidden flex flex-col items-center">
          <div className="text-base font-bold flex items-center justify-center gap-1.5 mb-1">
            <span>支持更新 (*,,•ᴗ•,,)ꔛ‬ꕤ</span>
          </div>
          <p className="text-[11px] opacity-95 mb-3.5 leading-snug font-medium">
            如果您喜歡 bereaDy，歡迎給我一點鼓勵！
          </p>
          <a 
            href={info.sponsorUrl || 'https://portaly.cc/tnnodisney'} 
            target="_blank" 
            rel="noreferrer" 
            className="w-full py-2.5 bg-white text-[#3ca1a4] font-black rounded-full text-xs shadow-sm hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-1"
          >
            <span>小額贊助 ♡</span>
          </a>
        </div>

        {/* 更新說明 */}
        <div className="text-xs space-y-1 bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100/80">
          <div className="font-bold text-amber-800 flex items-center justify-between">
            <span>📍 更新說明</span>
            <span className="text-[10px] text-amber-600 font-normal">更新時間：{info.lastUpdate || '2026/07/23'}</span>
          </div>
          <p className="text-amber-700/90 text-[11px] leading-relaxed whitespace-pre-line">
            {info.updateNotice || '固定每月 1 號更新當月活動，無法完全即時。'}
          </p>
        </div>

        {/* 💡 問題回饋區塊：正式換成 Emoji 💬 */}
        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center justify-between text-xs">
          <span className="font-bold text-gray-700 flex items-center gap-1.5">
            <span className="text-sm">💬</span>
            <span>有使用上的建議想告訴我？</span>
          </span>
          <a 
            href={info.feedbackUrl || 'https://portaly.cc/tnnodisney'} 
            target="_blank" 
            rel="noreferrer"
            className="font-bold text-[#3ca1a4] hover:opacity-80 flex items-center gap-0.5 active:scale-95 transition-all"
          >
            <span>填寫回饋表單</span>
            <span>➔</span>
          </a>
        </div>

        {/* 注意事項 */}
        <div className="text-[11px] text-gray-400 bg-gray-50 p-3 rounded-2xl border border-gray-100 leading-relaxed whitespace-pre-line">
          <span className="font-bold text-gray-500 block mb-0.5">⚠️ 注意事項</span>
          {info.disclaimer || 'bereaDy 是一款非官方攻略幫手。內容為個人整理與旅遊資訊分享，活動、營運及商品資訊可能有所異動，請以東京迪士尼度假區官方最新公告為準。'}
        </div>

        <button 
          onClick={onClose} 
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl text-sm transition-colors"
        >
          關閉
        </button>
      </div>
    </div>
  );
};

interface ParkGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  parkType: 'land' | 'sea';
  guides: any[];
}
const ParkGuideModal: React.FC<ParkGuideModalProps> = ({ isOpen, onClose, parkType, guides }) => {
  if (!isOpen) return null;
  const isLand = parkType === 'land';
  const displayTitle = isLand ? '樂園攻略' : '海洋攻略';

  const groupedGuides: any = {};
  guides.forEach(g => {
    const cat = g.category || '一般攻略';
    if (!groupedGuides[cat]) groupedGuides[cat] = [];
    groupedGuides[cat].push(g);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-md bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl border border-white/50 flex flex-col max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-200/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl ${isLand ? 'bg-stone-100' : 'bg-blue-100'}`}>
              {isLand ? '🏰' : '🌋'}
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">{displayTitle}</h3>
              <p className="text-xs text-gray-400">園區文章全輯</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500"><X size={18}/></button>
        </div>

        <div className="overflow-y-auto space-y-5 pr-1 flex-1 no-scrollbar">
          {Object.keys(groupedGuides).length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">尚無資料</div>
          ) : (
            Object.keys(groupedGuides).map(catKey => (
              <div key={catKey} className="bg-white/60 p-4 rounded-2xl border border-white/80 shadow-sm">
                <h4 className="font-bold text-xs text-gray-400 mb-3 uppercase tracking-wider">{catKey}</h4>
                <div className="space-y-2">
                  {groupedGuides[catKey].map((g: any, idx: number) => {
                    const favicon = getFaviconUrl(g.link);
                    return (
                      <a 
                        key={idx} 
                        href={g.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-stone-50 transition-all border border-gray-100/80 group"
                      >
                        <div className="flex items-center gap-2.5">
                          {favicon ? (
                            <img src={favicon} className="w-5 h-5 rounded object-contain" alt="icon"/>
                          ) : (
                            <LinkIcon size={14} className="text-stone-500"/>
                          )}
                          <span className="text-sm font-medium text-gray-700 group-hover:text-stone-800 transition-colors">{g.title}</span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface AddItemModalProps { isOpen: boolean; onClose: () => void; onAdd: (facility: Facility) => void; park: 'land' | 'sea'; facilitiesDb: Facility[]; tm: any; }
const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onAdd, park, facilitiesDb, tm }) => {
  const [selectedCategory, setSelectedCategory] = useState<FacilityType>('ride');
  const [searchTerm, setSearchTerm] = useState("");
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const safeTm = tm || THEMES.cream;

  if (!isOpen) return null;
  const filteredFacilities = facilitiesDb.filter(f =>
    f.park === park && f.category === selectedCategory &&
    (f.name.includes(searchTerm) || f.enName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleFacilityClick = (facility: Facility) => {
    onAdd(facility);
    setAddedIds(prev => [...prev, facility.id]);
    setTimeout(() => {
      setAddedIds(prev => prev.filter(id => id !== facility.id));
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md h-[75vh] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#5a4d41]" /> 新增行程
          </h3>
          <button onClick={onClose} className="p-2 bg-gray-200 rounded-full text-gray-500"><X size={16}/></button>
        </div>
        <div className="flex p-2 gap-2 bg-white overflow-x-auto no-scrollbar border-b shrink-0">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button 
                key={cat.id} 
                onClick={() => setSelectedCategory(cat.id)} 
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all shrink-0 ${isActive ? `${safeTm.primary} ${safeTm.buttonText || 'text-gray-800'} shadow-md` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                <Icon size={14} /> {cat.label}
              </button>
            )
          })}
        </div>
        <div className="p-3 border-b shrink-0">
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-xl">
            <Search size={16} className="text-gray-400"/>
            <input type="text" placeholder="搜尋設施名稱..." className="bg-transparent outline-none text-sm w-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2 bg-gray-50">
          {filteredFacilities.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">沒有找到相關項目</div>
          ) : (
            filteredFacilities.map(facility => {
              const isJustAdded = addedIds.includes(facility.id);
              return (
                <button 
                  key={facility.id} 
                  onClick={() => handleFacilityClick(facility)} 
                  disabled={facility.status === '維修中'} 
                  className={`w-full text-left p-3 rounded-xl border flex items-center justify-between group transition-all active:scale-[0.98] ${facility.status === '維修中' ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed' : isJustAdded ? `${safeTm.bg} ${safeTm.border} ring-2 ring-stone-200` : 'bg-white border-gray-100 hover:border-stone-300 hover:shadow-sm'}`}
                >
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{facility.name}</div>
                    <div className="text-[10px] text-gray-400">{facility.enName}</div>
                  </div>
                  {facility.status !== '營運中' ? (
                    <span className="text-[10px] bg-red-100 text-red-500 px-2 py-1 rounded-md font-bold">{facility.status}</span>
                  ) : isJustAdded ? (
                    <span className={`text-xs font-bold px-2 py-1 ${safeTm.bg} ${safeTm.text} rounded-lg`}>已新增 ✓</span>
                  ) : (
                    <Plus size={18} className="text-gray-300 group-hover:text-stone-600" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

interface MapModalProps { isOpen: boolean; onClose: () => void; items: any[]; park: 'land' | 'sea'; facilitiesDb: Facility[]; }
const MapModal: React.FC<MapModalProps> = ({ isOpen, onClose, items, park, facilitiesDb }) => {
  if (!isOpen) return null;

  const validPoints = items.map(item => {
    const fac = facilitiesDb.find(f => f.name === item.title);
    return fac ? { ...fac, title: item.title } : null;
  }).filter(Boolean) as (Facility & { title: string })[];

  const centerLat = park === 'land' ? 35.6329 : 35.6267;
  const centerLng = park === 'land' ? 139.8804 : 139.8851;
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  const currentTarget = validPoints[selectedIdx] || null;
  const currentLat = currentTarget ? currentTarget.lat : centerLat;
  const currentLng = currentTarget ? currentTarget.lng : centerLng;
  const currentName = currentTarget ? encodeURIComponent(currentTarget.name) : '';

  const embedUrl = currentTarget 
    ? `https://maps.google.com/maps?q=${currentLat},${currentLng}+(${currentName})&hl=zh-TW&z=17&output=embed`
    : `https://maps.google.com/maps?q=${centerLat},${centerLng}&hl=zh-TW&z=15&output=embed`;

  const openExternalMap = () => {
    if (validPoints.length === 0) return;
    const origin = `${validPoints[0].lat},${validPoints[0].lng}`;
    const destination = `${validPoints[validPoints.length - 1].lat},${validPoints[validPoints.length - 1].lng}`;
    const waypoints = validPoints.slice(1, -1).map(p => `${p.lat},${p.lng}`).join('|');
    const dirUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=walking`;
    window.open(dirUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">
        <div className="flex justify-between items-center p-4 bg-gray-50 border-b shrink-0">
          <div>
            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <Map className="w-5 h-5 text-blue-500" /> 行程地圖 ({park === 'land' ? '樂園' : '海洋'})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={openExternalMap} className="text-xs bg-blue-600 text-white px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-md hover:bg-blue-700 active:scale-95 transition-all">
              <Navigation size={14}/> 畫路線圖 ↗
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><X size={20}/></button>
          </div>
        </div>

        <div className="bg-blue-50/80 px-4 py-2 border-b border-blue-100 text-xs text-blue-700 font-medium shrink-0">
          💡 點選下方按鈕會直接拉近並定位到該設施！
        </div>

        <div className="flex-1 relative bg-gray-100">
          <iframe 
            key={embedUrl}
            title="Google Map Inner Preview"
            src={embedUrl}
            className="w-full h-full border-0"
            loading="lazy"
          ></iframe>
        </div>

        <div className="p-3 bg-white border-t overflow-x-auto no-scrollbar flex gap-2 shrink-0">
          {validPoints.length === 0 ? (
            <div className="text-xs text-gray-400 py-1 w-full text-center">尚未新增行程或對應不到設施地點</div>
          ) : (
            validPoints.map((item, idx) => {
              const isSelected = idx === selectedIdx;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedIdx(idx)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl shrink-0 transition-all text-xs font-bold ${
                    isSelected 
                      ? 'bg-blue-600 text-white shadow-md scale-105' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isSelected ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'
                  }`}>
                    {idx + 1}
                  </span>
                  <span>{item.name}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('todo');
  const [data, setData] = useState(DEFAULT_DATA);
  const [facilitiesDb, setFacilitiesDb] = useState<Facility[]>(DEFAULT_FACILITIES);
  const [parkMode, setParkMode] = useState<'land' | 'sea'>('land');
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{groupId: string, itemId: string, subId?: string} | null>(null);
  
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    title: string;
    link: string;
    type: 'todo' | 'mylist';
    targetData?: any;
  }>({ isOpen: false, title: '', link: '', type: 'todo' });

  const [tempProfile, setTempProfile] = useState({ name: "請輸入名字", date: "", theme: "cream", image: "", positionY: 50, scale: 1 });
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const [showNav, setShowNav] = useState(true);
  const [guideModal, setGuideModal] = useState<{ isOpen: boolean; park: 'land' | 'sea' }>({ isOpen: false, park: 'land' });
  const lastScrollY = useRef(0);

  const myListTapRef = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchCloudData = async () => {
      try {
        const todoRes = await fetch(FETCH_URLS.todo);
        if (todoRes.ok) {
          const csvText = await todoRes.text();
          const rows = parseCSV(csvText);
          const groupsMap: any = {};
          rows.forEach(r => {
            const { groupId, groupTitle, itemId, itemTitle, subId, subTitle, link } = r;
            if (!groupId) return;
            if (!groupsMap[groupId]) groupsMap[groupId] = { id: groupId, title: groupTitle, items: [] };
            let item = groupsMap[groupId].items.find((i: any) => i.id === itemId);
            if (!item && itemId) {
              item = { id: itemId, title: itemTitle, done: false, link: subId ? '' : link, subs: [] };
              groupsMap[groupId].items.push(item);
            }
            if (subId && subTitle) {
              item.subs.push({ id: subId, title: subTitle, done: false, link });
            }
          });
          const fetchedTodo = Object.values(groupsMap);
          if (fetchedTodo.length > 0) {
            setData(prev => ({ ...prev, todo: fetchedTodo }));
          }
        }

        const newsRes = await fetch(FETCH_URLS.news);
        if (newsRes.ok) {
          const csvText = await newsRes.text();
          const rows = parseCSV(csvText);
          
          const landGuides: any[] = [];
          const seaGuides: any[] = [];
          const eventsMap: any = {};
          const products: any[] = [];

          rows.forEach((r, idx) => {
            const type = r.type || r.sectionId || '';
            const title = r.title || r.itemTitle || '';
            const date = r.date || '';

            if (type === 'land_guide') {
              if (title) landGuides.push({ category: r.category || '攻略', title, link: r.link });
            } else if (type === 'sea_guide') {
              if (title) seaGuides.push({ category: r.category || '攻略', title, link: r.link });
            } else if (type === 'event' || type === 'news_1') {
              if (title) {
                const evKey = title;
                if (!eventsMap[evKey]) {
                  eventsMap[evKey] = { id: `ev_${idx}`, title, link: r.link, date, quickLinks: [] };
                }
                if (r.quickLabel && r.quickLink) {
                  eventsMap[evKey].quickLinks.push({ label: r.quickLabel, link: r.quickLink });
                }
              }
            } else if (type === 'product' || type === 'news_2') {
              if (title) products.push({ id: `p_${idx}`, title, link: r.link, date });
            }
          });

          setData(prev => ({
            ...prev,
            news: {
              landGuides: landGuides.length > 0 ? landGuides : prev.news.landGuides,
              seaGuides: seaGuides.length > 0 ? seaGuides : prev.news.seaGuides,
              events: Object.values(eventsMap).length > 0 ? Object.values(eventsMap) : prev.news.events,
              products: products.length > 0 ? products : prev.news.products
            }
          }));
        }

        const facRes = await fetch(FETCH_URLS.facilities);
        if (facRes.ok) {
          const csvText = await facRes.text();
          const rows = parseCSV(csvText);
          const fetchedFacs: Facility[] = rows.map(r => ({
            id: r.id,
            park: r.park as any,
            category: r.category as any,
            name: r.name,
            enName: r.enName,
            status: r.status as any,
            lat: parseFloat(r.lat) || 35.6329,
            lng: parseFloat(r.lng) || 139.8804,
          }));
          if (fetchedFacs.length > 0) setFacilitiesDb(fetchedFacs);
        }

        if (FETCH_URLS.about) {
          const aboutRes = await fetch(FETCH_URLS.about);
          if (aboutRes.ok) {
            const csvText = await aboutRes.text();
            const rows = parseCSV(csvText);
            const aboutObj: any = {};
            rows.forEach(r => {
              const k = (r.key || r.Key || '').trim().toLowerCase();
              const v = (r.value || r.Value || '').trim();
              if (k) aboutObj[k] = v;
            });

            setData(prev => ({
              ...prev,
              about: {
                lastUpdate: aboutObj.last_update || prev.about?.lastUpdate || '2026/07/23',
                updateNotice: aboutObj.update_notice || prev.about?.updateNotice || '固定每月 1 號更新，無法完全及時！有需要請自行調整內容！',
                disclaimer: aboutObj.disclaimer || prev.about?.disclaimer || '此 App 非官方製作，內容僅供參考。請以官方資訊為準，勿作商業用途。',
                igUrl: aboutObj.ig_url || prev.about?.igUrl || 'https://www.instagram.com/tnnodisney',
                threadsUrl: aboutObj.threads_url || prev.about?.threadsUrl || 'https://www.threads.net/@tnnodisney',
                sponsorUrl: aboutObj.sponsor_url || prev.about?.sponsorUrl || 'https://portaly.cc/tnnodisney',
                feedbackUrl: aboutObj.feedback_url || prev.about?.feedbackUrl || 'https://portaly.cc/tnnodisney'
              }
            }));
          }
        }

      } catch (e) {
        console.error("Cloud Fetch Error:", e);
      }
    };

    try {
      const savedData = localStorage.getItem('disney_data_v32_no_ext_link');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setData(prev => ({ ...prev, ...parsed }));
        if (parsed.userProfile?.name && parsed.userProfile?.name !== '請輸入名字') setShowOnboarding(false);
        setTempProfile(prev => ({ ...prev, ...parsed.userProfile }));
      }
    } catch (e) { console.error(e); }

    fetchCloudData();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('disney_data_v32_no_ext_link', JSON.stringify(data));
    } catch (e) {
      console.error("LocalStorage Full!", e);
    }
  }, [data]);

  const tm = THEMES[data.userProfile?.theme] || THEMES.cream;

  const handleUseDefaultImage = () => setTempProfile(p => ({ ...p, image: "/default_cover.jpg" }));
  const handleClearImage = () => setTempProfile(p => ({ ...p, image: "" }));
  
  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]);
  };

  const toggleFavorite = (id: string) => {
    setData(prev => {
      const currentFavs = prev.favorites || [];
      const exists = currentFavs.includes(id);
      const newFavs = exists ? currentFavs.filter(fId => fId !== id) : [...currentFavs, id];
      return { ...prev, favorites: newFavs };
    });
  };

  const handleDragEndPlan = (event: any) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((prev) => {
        const currentList = prev.plan[parkMode];
        const oldIndex = currentList.findIndex((i: any) => i.id === active.id);
        const newIndex = currentList.findIndex((i: any) => i.id === over.id);
        return { ...prev, plan: { ...prev.plan, [parkMode]: arrayMove(currentList, oldIndex, newIndex) } };
      });
    }
  };

  const handleDeletePlanItem = (id: string) => {
    setData(prev => ({ ...prev, plan: { ...prev.plan, [parkMode]: prev.plan[parkMode].filter((i: any) => i.id !== id) } }));
  };

  const handleAddFacility = (facility: Facility) => {
    const newItem = { id: Date.now().toString(), title: facility.name, enName: facility.enName, category: facility.category, status: facility.status };
    setData(prev => ({ ...prev, plan: { ...prev.plan, [parkMode]: [...prev.plan[parkMode], newItem] } }));
  };

  const handleCopyPlan = () => {
    const currentList = data.plan[parkMode];
    if (currentList.length === 0) return alert('行程是空的喔!');
    let text = `迪士尼${parkMode === 'land' ? '樂園' : '海洋'}行程\n`;
    currentList.forEach((item: any, index: number) => { text += `${index + 1}. ${item.title}\n`; });
    navigator.clipboard.writeText(text);
    alert('已複製行程到剪貼簿!');
  };

  const openActionMenu = (groupId: string, itemId: string, subId?: string) => {
    setSelectedItem({ groupId, itemId, subId });
    setMenuOpen(true);
  };

  const executeAction = (action: string) => {
    if (!selectedItem) return;
    const { groupId, itemId, subId } = selectedItem;
    const group = data.todo.find((g:any) => g.id === groupId);
    const item = group?.items.find((i:any) => i.id === itemId);
    const sub = subId && item?.subs ? item.subs.find((s:any) => s.id === subId) : null;
    const target = sub || item;

    if (action === 'delete') {
      if(confirm('確定刪除嗎?')) {
        const newData = JSON.parse(JSON.stringify(data));
        const g = newData.todo.find((x:any) => x.id === groupId);
        const it = g.items.find((x:any) => x.id === itemId);
        if(sub) it.subs = it.subs.filter((s:any) => s.id !== subId);
        else g.items = g.items.filter((x:any) => x.id !== itemId);
        setData(newData);
      }
    } else if (action === 'edit_combined') {
      setEditModal({
        isOpen: true,
        title: target.title,
        link: target.link || '',
        type: 'todo',
        targetData: { groupId, itemId, subId }
      });
    } else if (action === 'indent' && !sub) {
      const newData = JSON.parse(JSON.stringify(data));
      const g = newData.todo.find((x:any) => x.id === groupId);
      const idx = g.items.findIndex((i:any) => i.id === itemId);
      if(idx > 0) {
        const prev = g.items[idx-1];
        if(!prev.subs) prev.subs = [];
        prev.subs.push(item);
        g.items.splice(idx, 1);
        setData(newData);
      }
    } else if (action === 'outdent' && sub) {
      const newData = JSON.parse(JSON.stringify(data));
      const g = newData.todo.find((x:any) => x.id === groupId);
      const it = g.items.find((x:any) => x.id === itemId);
      it.subs = it.subs.filter((s:any) => s.id !== subId);
      const parentIdx = g.items.findIndex((x:any) => x.id === itemId);
      g.items.splice(parentIdx + 1, 0, sub);
      setData(newData);
    } else if (action === 'move') {
      const newData = JSON.parse(JSON.stringify(data));
      const groupIdx = newData.todo.findIndex((g:any) => g.id === groupId);
      const nextGroup = newData.todo[(groupIdx + 1) % newData.todo.length];
      if(confirm(`移動到「${nextGroup.title}」?`)) {
        const g = newData.todo.find((x:any) => x.id === groupId);
        const it = g.items.find((x:any) => x.id === itemId);
        if(sub) {
          it.subs = it.subs.filter((s:any) => s.id !== subId);
          nextGroup.items.push(sub);
        } else {
          g.items = g.items.filter((x:any) => x.id !== itemId);
          nextGroup.items.push(it);
        }
        setData(newData);
      }
    }
    setMenuOpen(false);
  };

  const handleModalSave = (newTitle: string, newLink: string) => {
    if (editModal.type === 'todo') {
      const { groupId, itemId, subId } = editModal.targetData;
      const newData = JSON.parse(JSON.stringify(data));
      const group = newData.todo.find((g:any) => g.id === groupId);
      const item = group.items.find((i:any) => i.id === itemId);
      const sub = subId && item.subs ? item.subs.find((s:any) => s.id === subId) : null;
      const target = sub || item;
      if (target) {
        target.title = newTitle;
        target.link = newLink;
        setData(newData);
      }
    } else if (editModal.type === 'mylist') {
      const { itemId } = editModal.targetData;
      const newData = JSON.parse(JSON.stringify(data));
      const target = newData.myList.find((i: any) => i.id === itemId);
      if (target) {
        target.title = newTitle;
        target.link = newLink;
        setData(newData);
      }
    }
  };

  const quickAdd = (groupId: string, e: any) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const newData = JSON.parse(JSON.stringify(data));
      const group = newData.todo.find((g:any) => g.id === groupId);
      group.items.push({ id: Date.now().toString(), title: e.target.value, done: false });
      setData(newData);
      e.target.value = "";
    }
  };

  const toggleTodo = (groupId: string, itemId: string, subId?: string) => {
    const newData = JSON.parse(JSON.stringify(data));
    const group = newData.todo.find((g: any) => g.id === groupId);
    const item = group?.items.find((i: any) => i.id === itemId);

    if (!item) return;

    if (subId && item.subs) {
      const sub = item.subs.find((s: any) => s.id === subId);
      if (sub) {
        sub.done = !sub.done;
      }
      const allSubsDone = item.subs.every((s: any) => s.done);
      item.done = allSubsDone;
    } else {
      const nextState = !item.done;
      item.done = nextState;
      if (item.subs && item.subs.length > 0) {
        item.subs.forEach((sub: any) => {
          sub.done = nextState;
        });
      }
    }

    setData(newData);
  };

  const handleDragEndTodo = (event: any, groupId: string) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((prev) => {
        const newData = JSON.parse(JSON.stringify(prev));
        const group = newData.todo.find((g:any) => g.id === groupId);
        const oldIndex = group.items.findIndex((i:any) => i.id === active.id);
        const newIndex = group.items.findIndex((i:any) => i.id === over.id);
        group.items = arrayMove(group.items, oldIndex, newIndex);
        return newData;
      });
    }
  };

  const toggleMyList = (itemId: string) => {
    const newData = JSON.parse(JSON.stringify(data));
    if (!newData.myList) newData.myList = [];
    const item = newData.myList.find((i:any) => i.id === itemId);
    if (item) item.done = !item.done;
    setData(newData);
  };

  const deleteMyList = (itemId: string) => {
    const newData = JSON.parse(JSON.stringify(data));
    if (!newData.myList) newData.myList = [];
    newData.myList = newData.myList.filter((i:any) => i.id !== itemId);
    setData(newData);
  };

  const handleMyListDoubleTap = (item: any) => {
    const now = Date.now();
    const lastTap = myListTapRef.current[item.id] || 0;
    if (now - lastTap < 300) {
      setEditModal({
        isOpen: true,
        title: item.title,
        link: item.link || '',
        type: 'mylist',
        targetData: { itemId: item.id }
      });
    }
    myListTapRef.current[item.id] = now;
  };

  const handleAddMyList = () => {
    setEditModal({
      isOpen: true,
      title: '',
      link: '',
      type: 'mylist',
      targetData: { itemId: Date.now().toString(), isNew: true }
    });
  };

  const handleSaveModalWrapper = (title: string, link: string) => {
    if (editModal.type === 'mylist' && editModal.targetData?.isNew) {
      if (!title || !title.trim()) return;
      const newItem = { id: editModal.targetData.itemId, title: title.trim(), link: link.trim(), done: false };
      const newData = JSON.parse(JSON.stringify(data));
      if (!newData.myList) newData.myList = [];
      newData.myList.push(newItem);
      setData(newData);
    } else {
      handleModalSave(title, link);
    }
  };

  const getGroupProgress = (group: any) => {
    let total = 0, done = 0;
    group.items.forEach((item: any) => {
      total++; if (item.done) done++;
      if (item.subs) {
        item.subs.forEach((sub: any) => { total++; if (sub.done) done++; });
      }
    });
    return total === 0 ? 0 : (done / total) * 100;
  };

  const handleCopyList = () => {
    let text = "我的迪士尼清單\n";
    data.todo.forEach((g:any) => {
      text += `\n[${g.title}]\n`;
      g.items.forEach((i:any) => {
        if(!i.done) text += `☐ ${i.title}\n`;
        if(i.subs) { i.subs.forEach((s:any) => { if(!s.done) text += `  ☐ ${s.title}\n`; }); }
      });
    });
    navigator.clipboard.writeText(text);
    alert('已複製未完成項目!');
  };

  const handleReset = () => {
    if(confirm('確定要重置所有進度嗎? 會回到最初狀態喔!')) {
      setData(DEFAULT_DATA);
      localStorage.removeItem('disney_data_v32_no_ext_link');
      window.location.reload();
    }
  };

  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const compressed = await compressImage(file);
      setTempProfile(p => ({ ...p, image: compressed }));
    }
  };

  const finishOnboarding = () => {
    if (!tempProfile.name || tempProfile.name === "請輸入名字") return alert('請填寫名字喔!');
    if (!tempProfile.date) return alert('請選擇入園日期喔!');
    setData(prev => ({
      ...prev,
      userProfile: { name: tempProfile.name, visitDate: tempProfile.date, coverImage: tempProfile.image, coverPositionY: tempProfile.positionY, coverScale: tempProfile.scale, theme: tempProfile.theme }
    }));
    setShowOnboarding(false);
  };

  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getSortedNewsItems = (items: any[]) => {
    if (!items) return [];
    const favs = data.favorites || [];
    return [...items].sort((a, b) => {
      const aFav = favs.includes(a.id);
      const bFav = favs.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-28 font-sans flex flex-col justify-between">
      
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-white/95 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-sm py-10">
            <h2 className="text-2xl font-black text-center mb-1 text-gray-800">從0開始建立專屬攻略✨</h2>
            <div className="space-y-6 mt-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">封面照片</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-gray-50 bg-white overflow-hidden relative">
                  {tempProfile.image ? (
                    <img src={tempProfile.image} className="w-full h-full object-cover" style={{ objectPosition: `50% ${tempProfile.positionY}%`, transform: `scale(${tempProfile.scale})` }} />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400"><Upload size={24}/><span className="text-xs mt-2 font-medium">點擊上傳</span></div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
                <div className="flex gap-2 mt-2">
                  <button onClick={handleUseDefaultImage} className="flex-1 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-600 flex items-center justify-center gap-1 hover:bg-gray-200">
                    <ImageIcon size={14}/> 使用內建圖檔
                  </button>
                  <button onClick={handleClearImage} className="flex-1 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-600 flex items-center justify-center gap-1 hover:bg-gray-200">
                    <Palette size={14}/> 使用純色背景
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">圖片位置調整</label>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs text-gray-400 font-bold">上</span>
                  <input type="range" min="0" max="100" value={tempProfile.positionY} onChange={e => setTempProfile({...tempProfile, positionY: parseInt(e.target.value)})} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#6e5d51]"/>
                  <span className="text-xs text-gray-400 font-bold">下</span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">你的名字</label>
                <input 
                  type="text" 
                  placeholder="請輸入名字" 
                  className="w-full p-4 bg-gray-100 rounded-xl font-bold text-lg outline-none focus:ring-2 focus:ring-stone-400" 
                  value={tempProfile.name === "請輸入名字" ? "" : tempProfile.name} 
                  onChange={e => setTempProfile({...tempProfile, name: e.target.value})} 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">入園日期</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-4 text-gray-400" size={20}/>
                  <input type="date" className="w-full p-4 pl-12 bg-gray-100 rounded-xl font-bold outline-none text-sm" value={tempProfile.date} onChange={e => setTempProfile({...tempProfile, date: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">主題風格</label>
                <div className="flex gap-3 justify-center">
                  {Object.keys(THEMES).map(k => (
                    <button key={k} onClick={() => setTempProfile({...tempProfile, theme: k})} className={`w-10 h-10 rounded-full border-4 transition-transform ${tempProfile.theme === k ? 'border-gray-800 scale-110' : 'border-transparent'} ${THEMES[k].primary}`} />
                  ))}
                </div>
              </div>
              
              <button onClick={finishOnboarding} className={`w-full py-4 rounded-xl text-white font-extrabold text-lg tracking-wider shadow-lg mt-4 ${THEMES[tempProfile.theme].primary}`}>
                START!
              </button>
            </div>
          </div>
        </div>
      )}

      {!showOnboarding && (
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="relative h-72 w-full overflow-hidden">
              {data.userProfile.coverImage ? (
                <img src={data.userProfile.coverImage} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `50% ${data.userProfile.coverPositionY}%`, transform: `scale(${data.userProfile.coverScale || 1})` }} />
              ) : <div className={`w-full h-full ${tm.bg} flex items-center justify-center text-gray-300`}></div>}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              
              <div className="absolute bottom-20 left-6 text-white">
                <img 
                  src="/D_4.png" 
                  alt="be reaDy" 
                  className="h-20 w-auto object-contain drop-shadow-md mb-2"
                  onError={(e: any) => { e.target.onerror = null; e.target.src = '/logo_white.svg'; }}
                />
                <p className="text-sm font-medium opacity-90">{data.userProfile.name}的專屬攻略</p>
                
                <label className="relative mt-3 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs hover:bg-white/30 transition-colors cursor-pointer overflow-hidden font-medium">
                  <Calendar size={14}/>
                  <span className="relative z-0">{data.userProfile.visitDate || "選擇日期"}</span>
                  <input type="date" className="absolute inset-0 opacity-0 w-full h-full z-10 cursor-pointer" value={data.userProfile.visitDate} onChange={e => setData(prev => ({...prev, userProfile: {...prev.userProfile, visitDate: e.target.value}}))} />
                </label>
              </div>
              
              <div className="absolute bottom-20 right-6 text-white text-right">
                <span className="text-xs opacity-80 block mb-1 font-medium">倒數</span>
                <span className="text-4xl font-black flex items-baseline justify-end gap-1">{getDaysUntil(data.userProfile.visitDate)}<span className="text-sm font-medium">天</span></span>
              </div>
              
              <button 
                onClick={() => setIsAboutOpen(true)} 
                className="absolute top-6 right-6 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 active:scale-95 transition-all"
              >
                <Settings size={20}/>
              </button>
            </div>

            <main className="p-5 max-w-md mx-auto -mt-16 relative z-10">
              
              {/* 行程規劃 Tab */}
              {activeTab === 'plan' && (
                <div className="animate-in slide-in-from-bottom-4 duration-300">
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-[2rem] border border-white shadow-sm min-h-[400px]">
                    
                    <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                      <button onClick={() => setParkMode('land')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${parkMode === 'land' ? 'bg-white shadow-sm text-stone-700' : 'text-gray-400 hover:text-gray-600'}`}>
                        <span className="text-base">🏰</span> 樂園
                      </button>
                      <button onClick={() => setParkMode('sea')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${parkMode === 'sea' ? 'bg-white shadow-sm text-stone-700' : 'text-gray-400 hover:text-gray-600'}`}>
                        <span className="text-base">🌋</span> 海洋
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center mb-4 px-1">
                      <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800">
                        一日行程 <span className="bg-white px-2 py-0.5 rounded-full text-xs text-gray-400 border font-medium">{data.plan[parkMode].length}</span>
                      </h3>
                      <div className="flex gap-2 items-center">
                        <button onClick={() => setIsMapOpen(true)} className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors">
                          <Map size={14}/> 地圖
                        </button>
                        <button onClick={() => setIsAddModalOpen(true)} className={`w-8 h-8 flex items-center justify-center rounded-full text-white shadow-md transition-transform hover:scale-110 active:scale-95 ${tm.primary}`}>
                          <Plus size={20}/>
                        </button>
                      </div>
                    </div>
                    
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndPlan}>
                      <SortableContext items={data.plan[parkMode]} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2 pb-4">
                          {data.plan[parkMode].length === 0 ? (
                            <div className="text-center py-10 text-gray-300 border-2 border-dashed border-gray-200 rounded-xl text-xs">點擊上方+新增第一個行程</div>
                          ) : (
                            data.plan[parkMode].map((item: any, index: number) => (
                              <PlanItem key={item.id} id={item.id} item={item} onDelete={handleDeletePlanItem} index={index + 1} tm={tm} />
                            ))
                          )}
                        </div>
                      </SortableContext>
                    </DndContext>
                    
                    <div className="pt-4 border-t border-gray-100 flex justify-center">
                      <button onClick={handleCopyPlan} className="text-xs text-gray-400 font-bold hover:text-gray-600 border border-gray-200 px-4 py-2 rounded-full flex items-center gap-2">
                        <ClipboardList size={14}/> 複製行程
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 入園指南 Tab */}
              {activeTab === 'todo' && (
                <div className="space-y-6">
                  {data.todo.map((group:any) => {
                    const isCollapsed = collapsedGroups.includes(group.id);
                    return (
                      <div key={group.id} className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-2 pl-1 cursor-pointer" onClick={() => toggleGroupCollapse(group.id)}>
                          <div className="flex items-center gap-2">
                            {isCollapsed ? <ChevronDown size={20} className="text-gray-400"/> : <ChevronUp size={20} className="text-gray-400"/>}
                            <h3 className="font-bold text-lg text-gray-800">{group.title}</h3>
                          </div>
                          {!isCollapsed && <CircularProgress percentage={getGroupProgress(group)} colorClass={tm.text} />}
                        </div>
                        
                        {!isCollapsed && (
                          <>
                            <div className="mb-4"></div>
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEndTodo(e, group.id)}>
                              <SortableContext items={group.items} strategy={verticalListSortingStrategy}>
                                <div className="flex flex-col gap-3">
                                  {group.items.map((item:any) => (
                                    <TodoItem 
                                      key={item.id} 
                                      item={item} 
                                      tm={tm}
                                      onToggle={(itemId:string, subId?:string) => toggleTodo(group.id, itemId, subId)}
                                      onOpenMenu={(id:string, subId?:string) => openActionMenu(group.id, id, subId)}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                            <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                              <Plus size={18} className="text-gray-400"/>
                              <input type="text" placeholder="新增待辦..." className="bg-transparent outline-none text-sm font-medium w-full text-gray-600" onKeyDown={(e) => quickAdd(group.id, e)} />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  <div className="pt-4 flex gap-4 justify-center pb-8">
                    <button onClick={handleCopyList} className="text-xs text-gray-400 font-bold hover:text-gray-600 border border-gray-200 px-4 py-2 rounded-full flex items-center gap-2"><Copy size={14}/> 複製清單</button>
                    <button onClick={handleReset} className="text-xs text-red-300 font-bold hover:text-red-500 border border-red-100 px-4 py-2 rounded-full flex items-center gap-2"><RotateCcw size={14}/> 重置 APP</button>
                  </div>
                </div>
              )}

              {/* 攻略情報 Tab */}
              {activeTab === 'news' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setGuideModal({ isOpen: true, park: 'land' })}
                      className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center group hover:shadow-md transition-all active:scale-95"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mb-2 text-2xl group-hover:scale-110 transition-transform">
                        🏰
                      </div>
                      <span className="font-bold text-gray-800 text-base block">樂園攻略</span>
                    </button>

                    <button 
                      onClick={() => setGuideModal({ isOpen: true, park: 'sea' })}
                      className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center group hover:shadow-md transition-all active:scale-95"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-2 text-2xl group-hover:scale-110 transition-transform">
                        🌋
                      </div>
                      <span className="font-bold text-gray-800 text-base block">海洋攻略</span>
                    </button>
                  </div>

                  {/* 近期活動 */}
                  <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg text-gray-800 mb-4 pl-1">
                      近期活動
                    </h3>
                    <div className="space-y-3">
                      {getSortedNewsItems(data.news?.events || []).map((ev: any) => {
                        const hasMainLink = ev.link && ev.link !== '#';
                        const isFav = (data.favorites || []).includes(ev.id);

                        return (
                          <div key={ev.id} className={`p-4 rounded-2xl border transition-all ${isFav ? 'bg-amber-50/40 border-amber-200/80 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                            
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                {hasMainLink ? (
                                  <a href={ev.link} target="_blank" rel="noreferrer" className="font-bold text-gray-800 text-sm hover:text-stone-600 transition-colors leading-snug block">
                                    {ev.title}
                                  </a>
                                ) : (
                                  <span className="font-bold text-gray-800 text-sm leading-snug block select-text">
                                    {ev.title}
                                  </span>
                                )}
                              </div>

                              <button 
                                onClick={() => toggleFavorite(ev.id)} 
                                className="p-1 -mr-1 -mt-1 text-gray-300 hover:text-amber-400 active:scale-125 transition-all shrink-0"
                                title={isFav ? "取消置頂" : "置頂此活動"}
                              >
                                <Star size={18} className={isFav ? "fill-amber-400 text-amber-400" : ""} />
                              </button>
                            </div>

                            {ev.date && (
                              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white border border-gray-200/80 text-[11px] text-gray-500 font-medium shadow-2xs">
                                <span>📅</span>
                                <span>{ev.date}</span>
                              </div>
                            )}

                            {ev.quickLinks && ev.quickLinks.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200/60 flex flex-wrap gap-2">
                                {ev.quickLinks.map((q: any, qIdx: number) => (
                                  <a 
                                    key={qIdx} 
                                    href={q.link} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className={`text-[11px] font-bold bg-white text-gray-600 px-3 py-1.5 rounded-xl border border-gray-200 transition-all shadow-2xs hover:${tm.border} hover:${tm.text}`}
                                  >
                                    {q.label}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 近期新品 */}
                  <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg text-gray-800 mb-4 pl-1">
                      近期新品
                    </h3>
                    <div className="space-y-2">
                      {getSortedNewsItems(data.news?.products || []).map((p: any) => {
                        const hasMainLink = p.link && p.link !== '#';
                        const isFav = (data.favorites || []).includes(p.id);
                        const favicon = getFaviconUrl(p.link);

                        return (
                          <div key={p.id} className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${isFav ? 'bg-amber-50/40 border-amber-200/80 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {favicon ? (
                                <img src={favicon} alt="icon" className="w-5 h-5 rounded object-contain shrink-0"/>
                              ) : (
                                <ShoppingBag size={18} className="text-stone-400 shrink-0"/>
                              )}

                              <div className="flex-1 min-w-0">
                                {hasMainLink ? (
                                  <a href={p.link} target="_blank" rel="noreferrer" className="font-bold text-gray-700 text-sm hover:text-stone-800 transition-colors block truncate">
                                    {p.title}
                                  </a>
                                ) : (
                                  <span className="font-bold text-gray-700 text-sm block truncate select-text">
                                    {p.title}
                                  </span>
                                )}
                                {p.date && (
                                  <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
                                    📅 {p.date}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button 
                              onClick={() => toggleFavorite(p.id)} 
                              className="p-1 text-gray-300 hover:text-amber-400 active:scale-125 transition-all shrink-0"
                              title={isFav ? "取消置頂" : "置頂此新品"}
                            >
                              <Star size={18} className={isFav ? "fill-amber-400 text-amber-400" : ""} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* 我的清單 Tab */}
              {activeTab === 'mylist' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-4">
                    
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 text-center mb-4">
                      <ShoppingBag size={32} className={`mx-auto mb-2 ${tm.text} opacity-20`} />
                      <h3 className="text-gray-800 font-bold">我的清單</h3>
                      <p className="text-gray-400 text-xs mt-1">必買商品、必吃美食都記在這裡！</p>
                    </div>

                    <div className="space-y-3">
                      {data.myList?.map((item:any) => {
                        const itemFavicon = item.link ? getFaviconUrl(item.link) : null;
                        return (
                          <div 
                            key={item.id} 
                            onClick={() => handleMyListDoubleTap(item)}
                            className={`bg-white p-4 rounded-2xl border flex items-center gap-3 transition-all select-none cursor-pointer active:scale-[0.99] ${item.done ? 'opacity-50 border-gray-100' : 'border-gray-100 shadow-sm'}`}
                          >
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleMyList(item.id); }} 
                              className={`min-w-[24px] h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${item.done ? tm.primary + ' border-transparent' : 'border-gray-300'}`}
                            >
                              {item.done && <CheckCircle2 size={16} className="text-white" />}
                            </button>
                            
                            <span className={`flex-1 font-medium text-[15px] ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                              {item.title}
                            </span>
                            
                            <div className="flex items-center gap-2.5 shrink-0">
                              {item.link && item.link !== '#' ? (
                                <a href={item.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="p-1 block shrink-0">
                                  {itemFavicon ? (
                                    <img src={itemFavicon} alt="icon" className="w-[18px] h-[18px] rounded-md object-contain opacity-80 hover:opacity-100 block shrink-0" />
                                  ) : (
                                    <ExternalLink size={16} className="text-stone-400 hover:text-stone-600 shrink-0"/>
                                  )}
                                </a>
                              ) : null}

                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteMyList(item.id); }} 
                                className="text-gray-300 hover:text-red-400 p-1 rounded-lg transition-colors shrink-0"
                                title="刪除"
                              >
                                <Trash2 size={16}/>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button 
                      onClick={handleAddMyList} 
                      className={`w-full mt-4 px-6 py-4 rounded-xl ${tm.primary} ${tm.buttonText || 'text-white'} font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2`}
                    >
                      <Plus size={20}/> 新增項目
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>

          <footer className="py-6 text-center text-xs text-gray-400 font-medium space-y-0.5 select-none opacity-80">
            <p>© 2026 bereaDy</p>
            <p className="text-[11px] text-gray-400/80">Created by @tnnodisney</p>
          </footer>
        </div>
      )}

      {!showOnboarding && (
        <>
          <ActionMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} onAction={executeAction} itemType={selectedItem?.subId ? 'sub' : 'item'} />
          
          <ItemEditModal 
            isOpen={editModal.isOpen}
            onClose={() => setEditModal(prev => ({ ...prev, isOpen: false }))}
            onSave={handleSaveModalWrapper}
            initialTitle={editModal.title}
            initialLink={editModal.link}
            tm={tm}
          />

          <AboutModal 
            isOpen={isAboutOpen} 
            onClose={() => setIsAboutOpen(false)} 
            onOpenSettings={() => setShowOnboarding(true)} 
            aboutData={data.about}
            tm={tm}
          />

          <ParkGuideModal 
            isOpen={guideModal.isOpen} 
            onClose={() => setGuideModal({ isOpen: false, park: 'land' })}
            parkType={guideModal.park}
            guides={guideModal.park === 'land' ? (data.news?.landGuides || []) : (data.news?.seaGuides || [])}
          />

          <AddItemModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddFacility} park={parkMode} facilitiesDb={facilitiesDb} tm={tm} />
          <MapModal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} items={data.plan[parkMode]} park={parkMode} facilitiesDb={facilitiesDb} />
          
          <nav className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 w-full z-40 shadow-lg transition-transform duration-300 ${showNav ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="grid grid-cols-4 items-end pb-10 pt-3">
              <button onClick={() => setActiveTab('todo')} className="flex flex-col items-center gap-1 transition-all active:scale-95 group">
                <div className={`transition-all duration-300 ${activeTab === 'todo' ? '-translate-y-1' : ''}`}>
                  <CheckCircle2 size={22} className={activeTab === 'todo' ? tm.text : 'text-gray-300 group-hover:text-gray-400'} strokeWidth={activeTab === 'todo' ? 2.5 : 2} />
                </div>
                <span className={`text-xs font-bold transition-all duration-300 ${activeTab === 'todo' ? `${tm.text} -translate-y-1` : 'text-gray-400'}`}>入園指南</span>
              </button>
              <button onClick={() => setActiveTab('news')} className="flex flex-col items-center gap-1 transition-all active:scale-95 group">
                <div className={`transition-all duration-300 ${activeTab === 'news' ? '-translate-y-1' : ''}`}>
                  <BookOpen size={22} className={activeTab === 'news' ? tm.text : 'text-gray-300 group-hover:text-gray-400'} strokeWidth={activeTab === 'news' ? 2.5 : 2} />
                </div>
                <span className={`text-xs font-bold transition-all duration-300 ${activeTab === 'news' ? `${tm.text} -translate-y-1` : 'text-gray-400'}`}>攻略情報</span>
              </button>
              <button onClick={() => setActiveTab('plan')} className="flex flex-col items-center gap-1 transition-all active:scale-95 group">
                <div className={`transition-all duration-300 ${activeTab === 'plan' ? '-translate-y-1' : ''}`}>
                  <Map size={22} className={activeTab === 'plan' ? tm.text : 'text-gray-300 group-hover:text-gray-400'} strokeWidth={activeTab === 'plan' ? 2.5 : 2} />
                </div>
                <span className={`text-xs font-bold transition-all duration-300 ${activeTab === 'plan' ? `${tm.text} -translate-y-1` : 'text-gray-400'}`}>行程規劃</span>
              </button>
              <button onClick={() => setActiveTab('mylist')} className="flex flex-col items-center gap-1 transition-all active:scale-95 group">
                <div className={`transition-all duration-300 ${activeTab === 'mylist' ? '-translate-y-1' : ''}`}>
                  <List size={22} className={activeTab === 'mylist' ? tm.text : 'text-gray-300 group-hover:text-gray-400'} strokeWidth={activeTab === 'mylist' ? 2.5 : 2} />
                </div>
                <span className={`text-xs font-bold transition-all duration-300 ${activeTab === 'mylist' ? `${tm.text} -translate-y-1` : 'text-gray-400'}`}>我的清單</span>
              </button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}