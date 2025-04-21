import * as React from 'react';

import { cn } from '@/lib/utils';
import { Input } from './ui/input';

const InputWithIcon = React.forwardRef(

        ({ className, type, startIcon, endIcon, ...props }: any, ref) => {

                const StartIcon = startIcon;
                const EndIcon = endIcon;

                return (
                        <div className="w-full relative">
                                {StartIcon && (
                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                                <StartIcon.type
                                                        className={cn('h-8 w-8')}
                                                        {...startIcon.props}
                                                />
                                        </div>
                                )}
                                <Input
                                        type={type}
                                        className={cn(
                                                startIcon ? 'pl-10' : '',
                                                endIcon ? 'pr-10' : '',
                                                className
                                        )}
                                        ref={ref}
                                        {...props}
                                />
                                {EndIcon && (
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <EndIcon.type
                                                        className={cn('h-8 w-8')}
                                                        {...endIcon.props}
                                                />
                                        </div>
                                )}
                        </div>
                );
        }
);

InputWithIcon.displayName = 'InputWithIcon';

export { InputWithIcon };
