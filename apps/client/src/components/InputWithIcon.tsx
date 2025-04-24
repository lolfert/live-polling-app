import * as React from 'react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface InputWithIconProps
        extends React.InputHTMLAttributes<HTMLInputElement> {
        startIcon?: React.ReactElement;
        endIcon?: React.ReactElement;
}

const InputWithIcon = React.forwardRef<HTMLInputElement, InputWithIconProps>(

        (props, ref) => {

                const { type, className, startIcon, endIcon } = props;

                const startIconProps = startIcon?.props || {};
                const endIconProps = endIcon?.props || {};

                return (
                        <div className="w-full relative">
                                {startIcon && (
                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                                <startIcon.type
                                                        className={cn('h-8 w-8')}
                                                        {...startIconProps}
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
                                {endIcon && (
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <endIcon.type
                                                        className={cn('h-8 w-8')}
                                                        {...endIconProps}
                                                />
                                        </div>
                                )}
                        </div>
                );
        }
);

InputWithIcon.displayName = 'InputWithIcon';

export { InputWithIcon };
