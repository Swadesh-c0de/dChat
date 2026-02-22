import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, UserCircle2 } from "lucide-react";
import { uploadFileToIPFS } from "@/lib/ipfs";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDisplayName?: string;
    currentAvatarUrl?: string;
    onSaveProfile: (displayName: string, avatarUrl: string) => Promise<void>;
}

export const ProfileModal = ({ isOpen, onClose, currentDisplayName, currentAvatarUrl, onSaveProfile }: ProfileModalProps) => {
    const [displayName, setDisplayName] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setDisplayName(currentDisplayName || "");
            setAvatarPreview(currentAvatarUrl || "");
            setAvatarFile(null);
        }
    }, [isOpen, currentDisplayName, currentAvatarUrl]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (e.g. max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert("File size must be less than 5MB");
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!displayName.trim()) {
            alert("Please enter a display name.");
            return;
        }

        setIsSaving(true);
        try {
            let avatarUrl = currentAvatarUrl || "";

            if (avatarFile) {
                const cid = await uploadFileToIPFS(avatarFile);
                avatarUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
            }

            await onSaveProfile(displayName.trim(), avatarUrl);
            onClose();
        } catch (error) {
            console.error("Error saving profile", error);
            alert("Failed to save profile. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-zinc-950/95 border-zinc-800 backdrop-blur-xl rounded-2xl shadow-2xl max-w-sm sm:max-w-md p-6">
                <DialogHeader>
                    <DialogTitle className="text-white text-xl font-bold tracking-tight mb-1">Edit Profile</DialogTitle>
                    <DialogDescription className="text-zinc-400 text-sm">
                        Update your display name and profile picture. This will securely sync to your active chats.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-6 py-4">
                    <div className="flex flex-col items-center justify-center">
                        <div
                            className="relative w-24 h-24 rounded-full border-2 border-zinc-700 bg-zinc-900 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-zinc-500 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {avatarPreview ? (
                                <>
                                    <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                </>
                            ) : (
                                <div className="text-zinc-500 flex flex-col items-center group-hover:text-zinc-300 transition-colors">
                                    <UserCircle2 className="w-10 h-10 mb-1" />
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                        <span className="text-xs font-medium text-zinc-500 mt-3 group-hover:text-white transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            Change Photo
                        </span>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="displayName" className="text-sm font-semibold text-zinc-300 ml-1">
                            Display Name
                        </label>
                        <input
                            id="displayName"
                            type="text"
                            placeholder="Enter your name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            maxLength={30}
                            className="bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                        />
                    </div>
                </div>
                <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-2">
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || !displayName.trim()}
                        className="w-full bg-white hover:bg-zinc-200 text-black rounded-xl py-6 font-bold transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                        {isSaving ? "Saving & Syncing..." : "Save Profile"}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSaving}
                        className="w-full text-zinc-500 hover:text-white hover:bg-transparent transition-colors py-2"
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
