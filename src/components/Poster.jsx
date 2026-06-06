import { useDominantColor } from '../hooks/useDominantColor';
import { Film, Play, Tv, Star } from 'lucide-react';

export const Poster = ({ item, onClick, onQuickPlay, isUnreleased }) => {
    const color = useDominantColor(item['#IMG_POSTER']);

    return (
        <div 
            onClick={onClick}
            className="group w-36 sm:w-44 flex-shrink-0 cursor-pointer relative"
        >
            <div 
                className="aspect-[2/3] bg-darker rounded-xl overflow-hidden relative border border-white/5 group-hover:border-primary/50 transition-all duration-500 ease-out"
                style={{ 
                    boxShadow: color ? 'none' : 'none',
                    transition: 'box-shadow 0.5s ease-out'
                }}
                onMouseEnter={(e) => {
                    if (color) {
                        // color is [r, g, b, a], we create a new rgba with fixed alpha 0.4
                        e.currentTarget.style.boxShadow = `0 0 30px 5px rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.4)`;
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                }}
            >
                {item['#IMG_POSTER'] ? (
                    <img 
                        src={item['#IMG_POSTER']} 
                        alt={item['#TITLE']} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        loading="lazy" 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                        <Film className="text-gray-500" size={32} />
                    </div>
                )}

                {/* Quick Play Hover Button Overlay */}
                {!isUnreleased && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button
                        onClick={(e) => {
                        e.stopPropagation()
                        onQuickPlay(item)
                        }}
                        className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-primary hover:bg-primary/90 text-white transform translate-y-3 group-hover:translate-y-0 transition-all duration-300 shadow-lg shadow-black/40 hover:scale-105"
                    >
                        <Play size={18} className="fill-white ml-0.5 sm:size-[20px]" />
                    </button>
                    </div>
                )}

                {/* Type Badge */}
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded-full text-[10px] font-medium flex items-center gap-1">
                    {item.media_type === 'tv' ? (
                    <>
                        <Tv size={10} />
                        TV
                    </>
                    ) : (
                    <>
                        <Film size={10} />
                        Movie
                    </>
                    )}
                </div>

                {/* Rating Badge */}
                {item.vote_average !== undefined && (
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded-full text-[10px] font-medium flex items-center gap-1">
                    <Star size={8} className="text-yellow-500 fill-yellow-500" />
                    {item.vote_average > 0 ? item.vote_average.toFixed(1) : 'N/A'}
                    </div>
                )}
            </div>
            {/* Info Section (moved out of aspect ratio box) */}
            <div className="p-3">
                <h3 className="font-medium text-white text-xs sm:text-sm mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                    {item['#TITLE']}
                </h3>
            </div>
        </div>
    );
};
