import { motion } from "framer-motion";

export function SearchLoadingState() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="px-6 py-4 flex-1 flex flex-col"
        >
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="mx-auto w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-muted-foreground">
                        Loading search...
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
