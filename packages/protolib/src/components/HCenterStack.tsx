import React from "react"
import { StackProps, XStack } from "@my/ui"

export const HCenterStack = React.forwardRef((props: StackProps, ref:any) => (
    //@ts-ignore
    <XStack ref={ref} ai="center" jc="center" {...props}>
        {props.children}
    </XStack>
))

export default HCenterStack